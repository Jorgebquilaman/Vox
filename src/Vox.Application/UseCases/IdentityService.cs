using Vox.Application.DTOs;
using Vox.Application.Interfaces;
using Vox.Domain.Entities;
using Vox.Domain.Enums;
using Vox.Domain.Interfaces;

namespace Vox.Application.UseCases;

public class IdentityService : IIdentityService
{
    private readonly IUserRepository _userRepository;
    private readonly IAuthenticationService _authService;
    private readonly IUnitOfWork _unitOfWork;

    public IdentityService(
        IUserRepository userRepository,
        IAuthenticationService authService,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _authService = authService;
        _unitOfWork = unitOfWork;
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
    {
        var existing = await _userRepository.GetByEmailAsync(dto.Email);
        if (existing is not null)
            throw new InvalidOperationException("El email ya está registrado.");

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = _authService.HashPassword(dto.Password),
            Role = Enum.Parse<UserRole>(dto.Role),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _userRepository.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return new UserDto(user.Id, user.Name, user.Email, user.Role.ToString(), user.IsActive, user.CreatedAt);
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user is null ? null : new UserDto(user.Id, user.Name, user.Email, user.Role.ToString(), user.IsActive, user.CreatedAt);
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(u => new UserDto(u.Id, u.Name, u.Email, u.Role.ToString(), u.IsActive, u.CreatedAt));
    }

    public async Task DeactivateUserAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuario {id} no encontrado.");

        user.IsActive = false;
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }
}
