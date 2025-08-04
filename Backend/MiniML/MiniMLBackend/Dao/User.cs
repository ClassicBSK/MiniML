using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace MiniMLBackend.Dao
{
    [Table("users")]
    public class User
    {
        [Key]
        [Required]

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int userId { get; set; }
        public string username { set; get; }
        public string password { set; get; }

        public ICollection<SimulationInstance> simulations { get; set; }=new List<SimulationInstance>();
    }
}
