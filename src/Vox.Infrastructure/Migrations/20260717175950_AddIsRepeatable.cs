using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vox.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsRepeatable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRepeatable",
                table: "Questions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRepeatable",
                table: "Questions");
        }
    }
}
