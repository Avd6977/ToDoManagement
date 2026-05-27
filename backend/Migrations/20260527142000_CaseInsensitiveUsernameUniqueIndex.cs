using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ToDoManagement.Api.Migrations
{
    public partial class CaseInsensitiveUsernameUniqueIndex : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Username",
                table: "Users");

            migrationBuilder.Sql(
                "CREATE UNIQUE INDEX IX_Users_Username ON Users (Username COLLATE NOCASE);");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Username",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }
    }
}
