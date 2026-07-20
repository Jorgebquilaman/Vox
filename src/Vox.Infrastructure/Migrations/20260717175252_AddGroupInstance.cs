using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vox.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupInstance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GroupInstance",
                table: "Answers",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GroupInstance",
                table: "Answers");
        }
    }
}
