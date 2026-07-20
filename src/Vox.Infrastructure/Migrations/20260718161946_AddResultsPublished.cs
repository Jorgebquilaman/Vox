using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vox.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddResultsPublished : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ResultsPublished",
                table: "Surveys",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ResultsPublished",
                table: "Surveys");
        }
    }
}
