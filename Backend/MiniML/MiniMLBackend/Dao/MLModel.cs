using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MiniMLBackend.Dao
{
    [Table("MLModels")]
    public class MLModel
    {
        [Key]
        [Required]

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int modelId { get; set; }
        public string model {  get; set; }
        public int tp {  get; set; }
        public int tn { get; set; }
        public int fp { get; set; }
        public int fn { get; set; }

        [Column(TypeName = "timestamp")]
        public DateTime trainStart { get; set; }


        [Column(TypeName = "timestamp")]
        public DateTime trainEnd { get; set; }


        [Column(TypeName = "timestamp")]
        public DateTime testStart { get; set; }


        [Column(TypeName = "timestamp")]
        public DateTime testEnd { get; set; }

        [Column(TypeName = "timestamp")]
        public DateTime validStart { get; set; }


        [Column(TypeName = "timestamp")]
        public DateTime validEnd { get; set; }

        public int simId {  get; set; }

        [JsonIgnore]
        public SimulationInstance simulationInstance { get; set; } = null!;
    }
}
