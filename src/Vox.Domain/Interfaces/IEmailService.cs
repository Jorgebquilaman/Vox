using Vox.Domain.Entities;

namespace Vox.Domain.Interfaces;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string bodyHtml);
    Task SendAsync(string to, string subject, string bodyHtml, EmailSettings settings);
}
