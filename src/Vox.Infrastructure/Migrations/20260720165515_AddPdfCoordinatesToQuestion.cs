using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vox.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPdfCoordinatesToQuestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PdfPageNumber",
                table: "Questions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PdfPositionX",
                table: "Questions",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PdfPositionY",
                table: "Questions",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PdfPageNumber",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "PdfPositionX",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "PdfPositionY",
                table: "Questions");
        }
    }
}
