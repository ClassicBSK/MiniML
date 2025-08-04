using System.ComponentModel.DataAnnotations;

namespace MiniMLBackend.Model
{
    public class FileUpload
    {
        [Required]
        public IFormFile file { get; set; }
    }
}
