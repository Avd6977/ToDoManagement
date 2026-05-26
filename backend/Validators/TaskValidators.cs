using FluentValidation;
using ToDoManagement.Api.Dtos;
using ToDoManagement.Api.Services;

namespace ToDoManagement.Api.Validators;

public sealed class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
{
    private readonly IDateTimeService _dateTimeService;

    public CreateTaskRequestValidator(IDateTimeService dateTimeService)
    {
        _dateTimeService = dateTimeService;

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must be 200 characters or fewer.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must be 2000 characters or fewer.");

        RuleFor(x => x.DueDate)
            .Must(BeValidDate).WithMessage("Due date is invalid.")
            .Must(BeTodayOrFutureDate).WithMessage("Due date cannot be in the past.");
    }

    private static bool BeValidDate(DateTime? dueDate) => !dueDate.HasValue || dueDate.Value.Year is > 1900 and < 9999;

    private bool BeTodayOrFutureDate(DateTime? dueDate) => !dueDate.HasValue || dueDate.Value.Date >= _dateTimeService.UtcNow.Date;
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
