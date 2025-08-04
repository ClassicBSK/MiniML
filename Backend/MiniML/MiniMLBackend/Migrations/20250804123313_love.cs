using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MiniMLBackend.Migrations
{
    /// <inheritdoc />
    public partial class love : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    userId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    username = table.Column<string>(type: "text", nullable: false),
                    password = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.userId);
                });

            migrationBuilder.CreateTable(
                name: "simulations",
                columns: table => new
                {
                    simId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    simName = table.Column<string>(type: "text", nullable: false),
                    trainCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    userId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_simulations", x => x.simId);
                    table.ForeignKey(
                        name: "FK_simulations_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "userId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "csvfiles",
                columns: table => new
                {
                    csvId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    csvFile = table.Column<string>(type: "text", nullable: false),
                    recordsCount = table.Column<int>(type: "integer", nullable: false),
                    columnCount = table.Column<int>(type: "integer", nullable: false),
                    passRate = table.Column<float>(type: "real", nullable: false),
                    startDate = table.Column<DateTime>(type: "timestamp", nullable: false),
                    endDate = table.Column<DateTime>(type: "timestamp", nullable: false),
                    simId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_csvfiles", x => x.csvId);
                    table.ForeignKey(
                        name: "FK_csvfiles_simulations_simId",
                        column: x => x.simId,
                        principalTable: "simulations",
                        principalColumn: "simId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MLModels",
                columns: table => new
                {
                    modelId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    model = table.Column<string>(type: "text", nullable: false),
                    tp = table.Column<int>(type: "integer", nullable: false),
                    tn = table.Column<int>(type: "integer", nullable: false),
                    fp = table.Column<int>(type: "integer", nullable: false),
                    fn = table.Column<int>(type: "integer", nullable: false),
                    trainStart = table.Column<DateTime>(type: "timestamp", nullable: false),
                    trainEnd = table.Column<DateTime>(type: "timestamp", nullable: false),
                    testStart = table.Column<DateTime>(type: "timestamp", nullable: false),
                    testEnd = table.Column<DateTime>(type: "timestamp", nullable: false),
                    validStart = table.Column<DateTime>(type: "timestamp", nullable: false),
                    validEnd = table.Column<DateTime>(type: "timestamp", nullable: false),
                    simId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MLModels", x => x.modelId);
                    table.ForeignKey(
                        name: "FK_MLModels_simulations_simId",
                        column: x => x.simId,
                        principalTable: "simulations",
                        principalColumn: "simId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_csvfiles_simId",
                table: "csvfiles",
                column: "simId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MLModels_simId",
                table: "MLModels",
                column: "simId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_simulations_userId",
                table: "simulations",
                column: "userId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "csvfiles");

            migrationBuilder.DropTable(
                name: "MLModels");

            migrationBuilder.DropTable(
                name: "simulations");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
