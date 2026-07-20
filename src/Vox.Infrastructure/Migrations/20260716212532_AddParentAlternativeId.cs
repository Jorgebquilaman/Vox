using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vox.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddParentAlternativeId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentAlternativeId",
                table: "Questions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Questions_ParentAlternativeId",
                table: "Questions",
                column: "ParentAlternativeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_Alternatives_ParentAlternativeId",
                table: "Questions",
                column: "ParentAlternativeId",
                principalTable: "Alternatives",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Questions_Alternatives_ParentAlternativeId",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_ParentAlternativeId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "ParentAlternativeId",
                table: "Questions");
        }
    }
}
