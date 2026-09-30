using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sparks.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    username = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, collation: "Latin1_General_100_CI_AS_SC"),
                    display_name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    bio = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    avatar_key = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    activity_read_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "conversations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_a_id = table.Column<long>(type: "bigint", nullable: false),
                    user_b_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    last_message_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_conversations", x => x.id);
                    table.CheckConstraint("ck_conversations_user_order", "[user_a_id] < [user_b_id]");
                    table.ForeignKey(
                        name: "fk_conversations_users_user_a_id",
                        column: x => x.user_a_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_conversations_users_user_b_id",
                        column: x => x.user_b_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "posts",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    author_id = table.Column<long>(type: "bigint", nullable: false),
                    kind = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    body = table.Column<string>(type: "nvarchar(max)", maxLength: 10000, nullable: false),
                    image_key = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ai_prompt = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    edited_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_posts", x => x.id);
                    table.CheckConstraint("ck_posts_kind", "[kind] IN ('Regular', 'MovieScript', 'BookPlot', 'Artwork', 'Fashion', 'Photography', 'Haiku', 'Quote', 'Joke', 'Aphorism')");
                    table.ForeignKey(
                        name: "fk_posts_users_author_id",
                        column: x => x.author_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    conversation_id = table.Column<long>(type: "bigint", nullable: false),
                    sender_id = table.Column<long>(type: "bigint", nullable: false),
                    body = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    read_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_messages_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_messages_users_sender_id",
                        column: x => x.sender_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "comments",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    post_id = table.Column<long>(type: "bigint", nullable: false),
                    parent_comment_id = table.Column<long>(type: "bigint", nullable: true),
                    author_id = table.Column<long>(type: "bigint", nullable: false),
                    body = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    edited_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_comments", x => x.id);
                    table.ForeignKey(
                        name: "fk_comments_comments_parent_comment_id",
                        column: x => x.parent_comment_id,
                        principalTable: "comments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_comments_posts_post_id",
                        column: x => x.post_id,
                        principalTable: "posts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_comments_users_author_id",
                        column: x => x.author_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "post_likes",
                columns: table => new
                {
                    post_id = table.Column<long>(type: "bigint", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_post_likes", x => new { x.post_id, x.user_id });
                    table.ForeignKey(
                        name: "fk_post_likes_posts_post_id",
                        column: x => x.post_id,
                        principalTable: "posts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_post_likes_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "comment_likes",
                columns: table => new
                {
                    comment_id = table.Column<long>(type: "bigint", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_comment_likes", x => new { x.comment_id, x.user_id });
                    table.ForeignKey(
                        name: "fk_comment_likes_comments_comment_id",
                        column: x => x.comment_id,
                        principalTable: "comments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_comment_likes_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_comment_likes_user_id",
                table: "comment_likes",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_comments_author_id_id",
                table: "comments",
                columns: new[] { "author_id", "id" });

            migrationBuilder.CreateIndex(
                name: "ix_comments_parent_comment_id",
                table: "comments",
                column: "parent_comment_id");

            migrationBuilder.CreateIndex(
                name: "ix_comments_post_id_id",
                table: "comments",
                columns: new[] { "post_id", "id" });

            migrationBuilder.CreateIndex(
                name: "ix_conversations_user_a_id_user_b_id",
                table: "conversations",
                columns: new[] { "user_a_id", "user_b_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_conversations_user_b_id",
                table: "conversations",
                column: "user_b_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_conversation_id_id",
                table: "messages",
                columns: new[] { "conversation_id", "id" });

            migrationBuilder.CreateIndex(
                name: "ix_messages_sender_id",
                table: "messages",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "ix_post_likes_user_id_created_at",
                table: "post_likes",
                columns: new[] { "user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_posts_author_id_id",
                table: "posts",
                columns: new[] { "author_id", "id" });

            migrationBuilder.CreateIndex(
                name: "ix_posts_kind_id",
                table: "posts",
                columns: new[] { "kind", "id" });

            migrationBuilder.CreateIndex(
                name: "ix_users_username",
                table: "users",
                column: "username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "comment_likes");

            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "post_likes");

            migrationBuilder.DropTable(
                name: "comments");

            migrationBuilder.DropTable(
                name: "conversations");

            migrationBuilder.DropTable(
                name: "posts");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
