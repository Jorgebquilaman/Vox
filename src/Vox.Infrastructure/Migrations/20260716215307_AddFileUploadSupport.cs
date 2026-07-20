using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Vox.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFileUploadSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "Answers",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FileId",
                table: "Answers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "Answers",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "Answers");

            migrationBuilder.DropColumn(
                name: "FileId",
                table: "Answers");

            migrationBuilder.DropColumn(
                name: "FileName",
                table: "Answers");
        }
    }
}
