using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockCountBack.Models;

[Table("ntf_CountPerson")]
public class NtfCountPerson
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("fullName")]
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; }
}
