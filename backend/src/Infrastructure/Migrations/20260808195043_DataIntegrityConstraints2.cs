using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DataIntegrityConstraints2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TeacherSubjectAssignments_SubjectId",
                table: "TeacherSubjectAssignments");

            migrationBuilder.DropIndex(
                name: "IX_TeacherSubjectAssignments_TeacherId_SubjectId",
                table: "TeacherSubjectAssignments");

            migrationBuilder.DropIndex(
                name: "IX_Subjects_ClassId",
                table: "Subjects");

            migrationBuilder.DropIndex(
                name: "IX_StudentClassEnrollments_StudentId_ClassId",
                table: "StudentClassEnrollments");

            migrationBuilder.AlterColumn<string>(
                name: "Section",
                table: "Classes",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeacherSubjectAssignments_SubjectId",
                table: "TeacherSubjectAssignments",
                column: "SubjectId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeacherSubjectAssignments_TeacherId",
                table: "TeacherSubjectAssignments",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_ClassId_Name",
                table: "Subjects",
                columns: new[] { "ClassId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentClassEnrollments_StudentId",
                table: "StudentClassEnrollments",
                column: "StudentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Name_Section",
                table: "Classes",
                columns: new[] { "Name", "Section" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TeacherSubjectAssignments_SubjectId",
                table: "TeacherSubjectAssignments");

            migrationBuilder.DropIndex(
                name: "IX_TeacherSubjectAssignments_TeacherId",
                table: "TeacherSubjectAssignments");

            migrationBuilder.DropIndex(
                name: "IX_Subjects_ClassId_Name",
                table: "Subjects");

            migrationBuilder.DropIndex(
                name: "IX_StudentClassEnrollments_StudentId",
                table: "StudentClassEnrollments");

            migrationBuilder.DropIndex(
                name: "IX_Classes_Name_Section",
                table: "Classes");

            migrationBuilder.AlterColumn<string>(
                name: "Section",
                table: "Classes",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_TeacherSubjectAssignments_SubjectId",
                table: "TeacherSubjectAssignments",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherSubjectAssignments_TeacherId_SubjectId",
                table: "TeacherSubjectAssignments",
                columns: new[] { "TeacherId", "SubjectId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_ClassId",
                table: "Subjects",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentClassEnrollments_StudentId_ClassId",
                table: "StudentClassEnrollments",
                columns: new[] { "StudentId", "ClassId" },
                unique: true);
        }
    }
}
