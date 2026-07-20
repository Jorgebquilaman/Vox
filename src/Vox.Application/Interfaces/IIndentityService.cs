using Vox.Application.DTOs;

namespace Vox.Application.Interfaces;

public interface IIdentityService
{
    Task<UserDto> CreateUserAsync(CreateUserDto dto);
    Task<UserDto?> GetUserByIdAsync(int id);
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task DeactivateUserAsync(int id);
}
