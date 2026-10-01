using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparks.Api.Migrations
{
    /// <inheritdoc />
    public partial class LastSeenAndSharedSparks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "last_seen_at",
                table: "users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "shared_post_id",
                table: "messages",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_messages_shared_post_id",
                table: "messages",
                column: "shared_post_id");

            migrationBuilder.AddForeignKey(
                name: "fk_messages_posts_shared_post_id",
                table: "messages",
                column: "shared_post_id",
                principalTable: "posts",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_messages_posts_shared_post_id",
                table: "messages");

            migrationBuilder.DropIndex(
                name: "ix_messages_shared_post_id",
                table: "messages");

            migrationBuilder.DropColumn(
                name: "last_seen_at",
                table: "users");

            migrationBuilder.DropColumn(
                name: "shared_post_id",
                table: "messages");
        }
    }
}
