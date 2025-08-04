using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MiniMLBackend.Dao;
using MiniMLBackend.Model;
using MiniMLBackend.Service;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Net.Http.Headers;

namespace MiniMLBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CSVController : ControllerBase
    {
        private EF_DataContext datacontext;
        private CSVService csvService;
        private IMemoryCache memoryCache;
        private IConfiguration configuration;

        public CSVController(EF_DataContext datacontext,
            CSVService csvService, IMemoryCache memoryCache, IConfiguration configuration)
        {
            this.csvService = csvService;
            this.datacontext = datacontext;
            this.memoryCache = memoryCache;
            this.configuration = configuration;
        }

        [HttpPost("csvfile/{simId}")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(2_147_483_647)]
        [Authorize]
        public async Task<IActionResult> addCSVFile([FromForm]FileUpload upload,[FromRoute]int simId ) {
            Dictionary<string, object> result = new Dictionary<string, object>();
            if (upload == null) {
                return BadRequest("upload is null");
            }
            
            var file = upload.file;
            if (file == null || file.Length == 0)
            {
                result.Add("error", "File not supported");
                return BadRequest(result);
            }
            UserLogin user = GetCurrentUser();
            SimulationInstance s1=datacontext.Simulations.Include(s=>s.user).Where(s=>s.simId==simId).FirstOrDefault();
            //Console.WriteLine(user.username);
            if (s1 == null || s1.user.username != user.username) {
                result.Add("error", "Unauthorized access attempt");
                return Unauthorized(result);
            }

            if (file == null || file.Length == 0)
            {
                result.Add("error", "File not supported");
                return BadRequest(result);
            }
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0; 

            string csvText;
            using (var reader = new StreamReader(memoryStream, leaveOpen: true))
            {
                csvText = await reader.ReadToEndAsync();
            }
            memoryStream.Position = 0;
            using var httpClient = new HttpClient();
            using var content = new MultipartFormDataContent();
            var fileContent = new StreamContent(memoryStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");

            content.Add(fileContent, "file", file.FileName);
            var response = await httpClient.PostAsync("http://host.docker.internal:6969/csvfiletest", content);
            if (response.IsSuccessStatusCode)
            {
                var temp = await response.Content.ReadAsStringAsync();
                CSVResponse resultDict = JsonSerializer.Deserialize<CSVResponse>(temp);
                CSVFile cSVFile = new CSVFile()
                {
                    simId= simId,
                    columnCount=resultDict.ColumnCount,
                    recordsCount=resultDict.RecordsCount,
                    startDate=resultDict.StartDate,
                    endDate=resultDict.EndDate,
                    passRate=resultDict.PassRate,
                    csvFile=csvText,
                    simulationInstance=s1
                };
                datacontext.cSVFiles.Add(cSVFile);
                datacontext.SaveChanges();
                return Ok(resultDict);
            }
            else
            {
                return StatusCode((int)response.StatusCode, "FastAPI processing failed.");
            }
        }

        [HttpGet("csvfile/{simId}")]
        [Authorize]
        public async Task<IActionResult> GetCSVFile(int simId)
        {
            Dictionary<string, object> result = new Dictionary<string, object>();
            UserLogin user = GetCurrentUser();
            SimulationInstance s1 = datacontext.Simulations.Include(s => s.user).Where(s => s.simId == simId).FirstOrDefault();
            //Console.WriteLine(user.username);
            if (s1 == null || s1.user.username != user.username)
            {
                result.Add("error", "Unauthorized access attempt");
                return Unauthorized(result);
            }
            var csvString = datacontext.cSVFiles.Where(c=>c.simId==s1.simId).FirstOrDefault().csvFile;
            var csvBytes = Encoding.UTF8.GetBytes(csvString);
            var memoryStream = new MemoryStream(csvBytes); // Convert string to stream

            using var client = new HttpClient();
            using var content = new MultipartFormDataContent();

            var fileContent = new StreamContent(memoryStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");

            // "file" is the key FastAPI will look for
            content.Add(fileContent, "file", "data.csv");

            var response = await client.PostAsync("http://host.docker.internal:6969/csvfiletest", content);
            if (response.IsSuccessStatusCode)
            {
                var temp = await response.Content.ReadAsStringAsync();
                CSVResponse resultDict = JsonSerializer.Deserialize<CSVResponse>(temp);
                return Ok(resultDict);
            }
            else
            {
                return StatusCode((int)response.StatusCode, "FastAPI processing failed.");
            }

        }

        private UserLogin GetCurrentUser()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;

            if (identity != null)
            {
                var userClaims = identity.Claims;
                return new UserLogin
                {
                    username = userClaims.FirstOrDefault(o => o.Type == ClaimTypes.NameIdentifier)?.Value
                };
            }
            return null;
        }
    }
}
