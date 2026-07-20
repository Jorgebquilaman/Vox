namespace Vox.Domain.Interfaces;

public interface IFileStorageService
{
    Task<Guid> SaveAsync(Stream content);
    Task<Stream> GetStreamAsync(Guid fileId);
    Task DeleteAsync(Guid fileId);
}
