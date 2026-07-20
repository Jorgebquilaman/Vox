using Vox.Domain.Interfaces;

namespace Vox.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _storagePath;

    public FileStorageService()
    {
        _storagePath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "uploads");
        Directory.CreateDirectory(_storagePath);
    }

    public async Task<Guid> SaveAsync(Stream content)
    {
        var fileId = Guid.NewGuid();
        var dir = Path.Combine(_storagePath, fileId.ToString("N")[..2]);
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, fileId.ToString("N"));
        using var fs = new FileStream(path, FileMode.Create);
        await content.CopyToAsync(fs);
        return fileId;
    }

    public Task<Stream> GetStreamAsync(Guid fileId)
    {
        var path = GetFilePath(fileId);
        if (!File.Exists(path))
            throw new FileNotFoundException("Archivo no encontrado.");
        return Task.FromResult<Stream>(new FileStream(path, FileMode.Open, FileAccess.Read));
    }

    public Task DeleteAsync(Guid fileId)
    {
        var path = GetFilePath(fileId);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    private string GetFilePath(Guid fileId) =>
        Path.Combine(_storagePath, fileId.ToString("N")[..2], fileId.ToString("N"));
}
