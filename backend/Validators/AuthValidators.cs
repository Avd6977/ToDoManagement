using FluentValidation;
using ToDoManagement.Api.Dtos;

namespace ToDoManagement.Api.Validators;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    private const string EmailRegex = @"^[^\s@]+@[^\s@]+\.[^\s@]+$";

    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100).WithMessage("Full name must be 100 characters or fewer.");

        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Email is required.")
            .MaximumLength(254).WithMessage("Email must be 254 characters or fewer.")
            .Matches(EmailRegex).WithMessage("Email format is invalid.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .Matches("[A-Za-z]").WithMessage("Password must contain at least one letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.")
            .Matches("[^A-Za-z0-9]").WithMessage("Password must contain at least one special character.");
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    private const string EmailRegex = @"^[^\s@]+@[^\s@]+\.[^\s@]+$";

    public LoginRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Email is required.")
            .Matches(EmailRegex).WithMessage("Email format is invalid.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public sealed class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required.");
    }
}

public sealed class RevokeTokenRequestValidator : AbstractValidator<RevokeTokenRequest>
{
    public RevokeTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required.");
    }
}

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100).WithMessage("Full name must be 100 characters or fewer.");

        RuleFor(x => x.NewPassword)
            .Cascade(CascadeMode.Stop)
            .MinimumLength(8).When(x => !string.IsNullOrWhiteSpace(x.NewPassword)).WithMessage("Password must be at least 8 characters.")
            .Matches("[A-Za-z]").When(x => !string.IsNullOrWhiteSpace(x.NewPassword)).WithMessage("Password must contain at least one letter.")
            .Matches("[0-9]").When(x => !string.IsNullOrWhiteSpace(x.NewPassword)).WithMessage("Password must contain at least one number.")
            .Matches("[^A-Za-z0-9]").When(x => !string.IsNullOrWhiteSpace(x.NewPassword)).WithMessage("Password must contain at least one special character.");

        RuleFor(x => x.CurrentPassword)
            .NotEmpty().When(x => !string.IsNullOrWhiteSpace(x.NewPassword)).WithMessage("Current password is required to set a new password.");
    }
}
