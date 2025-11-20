using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StockCountBack.Models;

[Table("ntf_Location")]
public class NtfLocation
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("whsId")]
    [Required]
    [MaxLength(50)]
    public string WhsId { get; set; } = string.Empty;

    [Column("binLocation")]
    [Required]
    [MaxLength(50)]
    public string BinLocation { get; set; } = string.Empty;

    [Column("createdAt")]
    public DateTime? CreatedAt { get; set; }
}
