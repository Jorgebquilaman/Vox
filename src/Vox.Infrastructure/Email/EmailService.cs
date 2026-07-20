using Vox.Domain.Entities;
using Vox.Domain.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Vox.Infrastructure.Email;

public class EmailService : IEmailService
{
    public async Task SendAsync(string to, string subject, string bodyHtml)
    {
        throw new InvalidOperationException(
            "No hay configuración de correo guardada. Configurá el servidor SMTP en Configuración.");
    }

    public async Task SendAsync(string to, string subject, string bodyHtml, EmailSettings settings)
    {
        if (!settings.Enabled)
            throw new InvalidOperationException("El envío de correo está desactivado.");

        if (string.IsNullOrWhiteSpace(settings.Username) || string.IsNullOrWhiteSpace(settings.Password))
            throw new InvalidOperationException("Falta configurar usuario y contraseña del correo.");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(settings.FromName, settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = bodyHtml };
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(settings.SmtpHost, settings.SmtpPort,
            settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
        await client.AuthenticateAsync(settings.Username, settings.Password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
