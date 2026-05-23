using FluentValidation;
using ToDoManagement.Api.Dtos;

namespace ToDoManagement.Api.Validators;

public sealed class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must be 200 characters or fewer.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must be 2000 characters or fewer.");

        RuleFor(x => x.DueDate)
            .Must(BeValidDate).WithMessage("Due date is invalid.");
    }

    private static bool BeValidDate(DateTime? dueDate) => !dueDate.HasValue || dueDate.Value.Year is > 1900 and < 9999;
}

public sealed class UpdateTaskRequestValidator : AbstractValidator<UpdateTaskRequest>
{
    public UpdateTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must be 200 characters or fewer.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must be 2000 characters or fewer.");

        RuleFor(x => x.DueDate)
            .Must(BeValidDate).WithMessage("Due date is invalid.");
    }

    private static bool BeValidDate(DateTime? dueDate) => !dueDate.HasValue || dueDate.Value.Year is > 1900 and < 9999;
}
