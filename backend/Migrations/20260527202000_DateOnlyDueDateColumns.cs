using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ToDoManagement.Api.Migrations
{
    public partial class DateOnlyDueDateColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Tasks SET DueDate = substr(DueDate, 1, 10) WHERE DueDate IS NOT NULL;");
            migrationBuilder.Sql("UPDATE TaskHistory SET DueDate = substr(DueDate, 1, 10) WHERE DueDate IS NOT NULL;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
