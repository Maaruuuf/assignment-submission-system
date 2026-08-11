using System.Net;
using System.Text.Json;
using Application.Common.Exceptions;

namespace API.Middleware;

/// <summary>
/// Central place that turns every exception thrown anywhere in the pipeline into a consistent
/// JSON error response with the right HTTP status code, instead of leaking stack traces or
/// letting each controller action repeat its own try/catch.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title) = exception switch
        {
            NotFoundException => (HttpStatusCode.NotFound, "Not Found"),
            ForbiddenException => (HttpStatusCode.Forbidden, "Forbidden"),
            AccountDeactivatedException => (HttpStatusCode.Forbidden, "Account Blocked"),
            ConflictException => (HttpStatusCode.Conflict, "Conflict"),
            BusinessRuleException => (HttpStatusCode.BadRequest, "Bad Request"),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized"),
            _ => (HttpStatusCode.InternalServerError, "Internal Server Error")
        };

        // Anything that maps to a 500 is unexpected - log the full exception for diagnosis.
        // Everything else is an expected, well-understood outcome and only needs a warning.
        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception processing {Method} {Path}", context.Request.Method, context.Request.Path);
        }
        else
        {
            _logger.LogWarning("{Title} on {Method} {Path}: {Message}", title, context.Request.Method, context.Request.Path, exception.Message);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var payload = new
        {
            status = (int)statusCode,
            title,
            detail = statusCode == HttpStatusCode.InternalServerError ? "An unexpected error occurred." : exception.Message
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
}
