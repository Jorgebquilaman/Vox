using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Vox.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPreinscripcion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Aspirantes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Estado = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Apellido = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Nacionalidad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PaisEmisorDocumento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TipoDocumento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NumeroDocumento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ApellidoNombreLegal = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    ApellidoNombreElegido = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    IdentidadGenero = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EmailContacto = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FechaNacimiento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LugarNacimiento = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Calle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Numero = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Piso = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Departamento = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Localidad = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Provincia = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Pais = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CodigoPostal = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    EstudiosPrevios = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DatosSocioeconomicos = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    FechaPresentacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BandaHoraria = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    UltimaModificacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaFinalizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Aspirantes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Aspirantes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentosDigitales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AspiranteId = table.Column<int>(type: "integer", nullable: false),
                    Requisito = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FileId = table.Column<Guid>(type: "uuid", nullable: true),
                    FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ContentType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentosDigitales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentosDigitales_Aspirantes_AspiranteId",
                        column: x => x.AspiranteId,
                        principalTable: "Aspirantes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentosIdentidad",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AspiranteId = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Numero = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PaisEmisor = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentosIdentidad", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentosIdentidad_Aspirantes_AspiranteId",
                        column: x => x.AspiranteId,
                        principalTable: "Aspirantes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PropuestasElegidas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AspiranteId = table.Column<int>(type: "integer", nullable: false),
                    UnidadAcademica = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PropuestaFormativa = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Sede = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Modalidad = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropuestasElegidas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropuestasElegidas_Aspirantes_AspiranteId",
                        column: x => x.AspiranteId,
                        principalTable: "Aspirantes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TurnosPresentacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AspiranteId = table.Column<int>(type: "integer", nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BandaHoraria = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TurnosPresentacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TurnosPresentacion_Aspirantes_AspiranteId",
                        column: x => x.AspiranteId,
                        principalTable: "Aspirantes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Aspirantes_UserId",
                table: "Aspirantes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentosDigitales_AspiranteId",
                table: "DocumentosDigitales",
                column: "AspiranteId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentosIdentidad_AspiranteId",
                table: "DocumentosIdentidad",
                column: "AspiranteId");

            migrationBuilder.CreateIndex(
                name: "IX_PropuestasElegidas_AspiranteId",
                table: "PropuestasElegidas",
                column: "AspiranteId");

            migrationBuilder.CreateIndex(
                name: "IX_TurnosPresentacion_AspiranteId",
                table: "TurnosPresentacion",
                column: "AspiranteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentosDigitales");

            migrationBuilder.DropTable(
                name: "DocumentosIdentidad");

            migrationBuilder.DropTable(
                name: "PropuestasElegidas");

            migrationBuilder.DropTable(
                name: "TurnosPresentacion");

            migrationBuilder.DropTable(
                name: "Aspirantes");
        }
    }
}
