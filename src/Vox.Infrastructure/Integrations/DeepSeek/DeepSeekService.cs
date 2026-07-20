using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Infrastructure.Integrations.DeepSeek;

namespace Vox.Infrastructure.Integrations.DeepSeek;

public class DeepSeekService : IDeepSeekService
{
    private readonly HttpClient _httpClient;
    private readonly IDeepSeekSettingsProvider _settingsProvider;
    private readonly ILogger<DeepSeekService> _logger;

    private const string Endpoint = "chat/completions";

    // Esquema que pedimos al modelo (debe coincidir con CreateSurveyDto).
    private const string SystemPrompt =
        "Eres un asistente que convierte el modelo de una encuesta (extraído de un documento) " +
        "en una encuesta estructurada para el sistema Vox IUPA. " +
        "Responde SOLO con un objeto JSON válido, sin texto adicional, con esta forma exacta:\n" +
        "{\n" +
        "  \"title\": string,\n" +
        "  \"description\": string,\n" +
        "  \"targetAudience\": string | null,\n" +
        "  \"isAnonymous\": boolean,\n" +
        "  \"questions\": [\n" +
        "    {\n" +
        "      \"type\": \"Section\" | \"InfoText\" | \"SingleChoice\" | \"MultipleChoice\" | \"Dropdown\" | \"FreeText\" | \"SimpleField\" | \"StarRating\" | \"Thumbs\" | \"FileUpload\",\n" +
        "      \"title\": string,\n" +
        "      \"description\": string | null,\n" +
        "      \"isRequired\": boolean,\n" +
        "      \"isVisibleInReports\": boolean,\n" +
        "      \"fieldType\": \"Text\" | \"Number\" | \"Email\" | \"Phone\" | \"DNI\" | \"Date\" | null,\n" +
        "      \"alternatives\": [ { \"text\": string, \"score\": number } ] | null,\n" +
        "      \"pdfPageNumber\": number | null,\n" +
        "      \"pdfPositionX\": number | null,\n" +
        "      \"pdfPositionY\": number | null\n" +
        "    }\n" +
        "  ]\n" +
        "}\n" +
        "Reglas:\n" +
        "- 'SingleChoice', 'MultipleChoice' y 'Dropdown' deben incluir 'alternatives' con al menos 2 opciones; 'score' es un número (puede ser 0) que premia respuestas relevantes.\n" +
        "- 'SimpleField' debe usar 'fieldType' acorde (Text, Number, Email, Phone, DNI, Date).\n" +
        "- 'Section' agrupa preguntas siguientes; 'InfoText' es un bloque de texto informativo.\n" +
        "- 'StarRating' y 'Thumbs' no llevan alternativas.\n" +
        "- Mantén los títulos en español y fieles al documento. No inventes preguntas ajenas al modelo.\n" +
        "- Para 'pdfPageNumber': indica en qué página del PDF original aparece esta pregunta (1-based). Si Section o InfoText abarcan múltiples páginas, usa null.\n" +
        "- Para 'pdfPositionY': estima la posición vertical como porcentaje (0-100) dentro de la página, donde 0 es el tope y 100 el fondo.\n" +
        "- 'pdfPositionX' puede ser null (se usará un margen izquierdo por defecto).";

    public DeepSeekService(
        HttpClient httpClient,
        IDeepSeekSettingsProvider settingsProvider,
        ILogger<DeepSeekService> logger)
    {
        _httpClient = httpClient;
        _settingsProvider = settingsProvider;
        _logger = logger;
    }

    public async Task<(CreateSurveyDto Survey, bool UsedAi)> GenerateSurveyAsync(string documentText, CancellationToken ct = default)
    {
        var settings = await _settingsProvider.GetEffectiveSettingsAsync();
        if (!settings.Enabled || string.IsNullOrWhiteSpace(settings.ApiKey))
            return DeepSeekDisabledFallback.BuildDemoSurvey(_logger);

        var userContent = $"Documento del modelo de encuesta:\n\n{documentText}\n\nGenera la encuesta en el formato JSON indicado.";

        var payload = new
        {
            model = settings.Model,
            messages = new[]
            {
                new { role = "system", content = SystemPrompt },
                new { role = "user", content = userContent }
            },
            temperature = 0.3,
            response_format = new { type = "json_object" }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        _httpClient.BaseAddress = new Uri(settings.BaseUrl.TrimEnd('/') + "/");
        _httpClient.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("DeepSeek devolvió {Status}: {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"El servicio de IA falló ({response.StatusCode}).");
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        var survey = ParseDeepSeekResponse(json);
        return (survey, true);
    }

    private static CreateSurveyDto ParseDeepSeekResponse(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // El modelo puede envolver el objeto en "choices[0].message.content".
        var content = root;
        if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
        {
            var message = choices[0].GetProperty("message");
            content = message.GetProperty("content");
        }

        var raw = content.ValueKind == JsonValueKind.String
            ? content.GetString()!
            : content.GetRawText();

        // Por si el modelo devuelve con decoración de código.
        raw = raw.Trim();
        if (raw.StartsWith("```"))
        {
            raw = raw.Replace("```json", "").Replace("```", "").Trim();
        }

        var dto = JsonSerializer.Deserialize<CreateSurveyDto>(raw, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? throw new InvalidOperationException("La IA no devolvió una encuesta válida.");

        if (dto.Questions is null || dto.Questions.Count == 0)
            throw new InvalidOperationException("La IA generó una encuesta sin preguntas.");

        return dto;
    }
}
