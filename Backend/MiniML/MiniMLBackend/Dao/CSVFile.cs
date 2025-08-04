using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MiniMLBackend.Dao
{
    [Table("csvfiles")]
    public class CSVFile
    {
        [Key]
        [Required]

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int csvId { get; set; }
        public string csvFile {  get; set; }
        public int recordsCount { get; set; }
        public int columnCount{  get; set; }
        public float passRate {  get; set; }
        [Column(TypeName = "timestamp")]
        public DateTime startDate { get; set; }
        [Column(TypeName = "timestamp")]
        public DateTime endDate { get; set; }

        public int simId;

        [JsonIgnore]
        public SimulationInstance simulationInstance { get; set; } = null!;

    }
}
