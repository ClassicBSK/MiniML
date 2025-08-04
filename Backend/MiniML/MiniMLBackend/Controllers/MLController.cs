using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MiniMLBackend.Dao;
using MiniMLBackend.Model;
using MiniMLBackend.Service;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace MiniMLBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MLController : ControllerBase
    {
        private EF_DataContext datacontext;
        private IMemoryCache memoryCache;
        private IConfiguration configuration;

        public MLController(EF_DataContext datacontext,
            IMemoryCache memoryCache, IConfiguration configuration)
        {
            this.datacontext = datacontext;
            this.memoryCache = memoryCache;
            this.configuration = configuration;
        }

        [HttpPost("ranges/{simId}")]
        [Authorize]
        public async Task<IActionResult> GetRangeData([FromBody] MLDateSpecifications rangeData, int simId)
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
            var csvString = datacontext.cSVFiles.Where(c => c.simId == s1.simId).FirstOrDefault().csvFile;
            var csvBytes = Encoding.UTF8.GetBytes(csvString);
            var memoryStream = new MemoryStream(csvBytes); // Convert string to stream

            using var client = new HttpClient();
            using var content = new MultipartFormDataContent();

            var fileContent = new StreamContent(memoryStream);
            using var httpClient = new HttpClient();

            fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");

            // "file" is the key FastAPI will look for
            content.Add(fileContent, "file", "data.csv");
            content.Add(new StringContent(rangeData.trainStart.ToString("o")), "trainStart");
            content.Add(new StringContent(rangeData.trainEnd.ToString("o")), "trainEnd");
            content.Add(new StringContent(rangeData.testStart.ToString("o")), "testStart"); 
            content.Add(new StringContent(rangeData.testEnd.ToString("o")), "testEnd");
            content.Add(new StringContent(rangeData.validStart.ToString("o")), "validStart"); 
            content.Add(new StringContent(rangeData.validEnd.ToString("o")), "validEnd");

            var response = await httpClient.PostAsync("http://host.docker.internal:6969/rangedata", content);
            if (response.IsSuccessStatusCode)
            {
                var temp = await response.Content.ReadAsStringAsync();
                Dictionary<int,RangeResponse> resultDict = JsonSerializer.Deserialize<Dictionary<int, RangeResponse>>(temp);
                return Ok(resultDict);

            }
            else
            {
                return StatusCode((int)response.StatusCode, "FastAPI processing failed.");
            }
        }
        [HttpPost("train/{simId}")]
        [Authorize]
        public async Task<IActionResult> TrainModel([FromBody] MLDateSpecifications rangeData, int simId)
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
            var csvString = datacontext.cSVFiles.Where(c => c.simId == s1.simId).FirstOrDefault().csvFile;
            var csvBytes = Encoding.UTF8.GetBytes(csvString);
            var memoryStream = new MemoryStream(csvBytes); // Convert string to stream

            using var client = new HttpClient();
            using var content = new MultipartFormDataContent();

            var fileContent = new StreamContent(memoryStream);
            using var httpClient = new HttpClient();

            fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");

            // "file" is the key FastAPI will look for
            content.Add(fileContent, "file", "data.csv");
            content.Add(new StringContent(rangeData.trainStart.ToString("o")), "trainStart");
            content.Add(new StringContent(rangeData.trainEnd.ToString("o")), "trainEnd");
            content.Add(new StringContent(rangeData.testStart.ToString("o")), "testStart");
            content.Add(new StringContent(rangeData.testEnd.ToString("o")), "testEnd");
            content.Add(new StringContent(rangeData.validStart.ToString("o")), "validStart");
            content.Add(new StringContent(rangeData.validEnd.ToString("o")), "validEnd");

            var response = await httpClient.PostAsync("http://host.docker.internal:6969/trainmodel", content);
            if (response.IsSuccessStatusCode)
            {
                var temp = await response.Content.ReadAsStringAsync();
                TrainResponse resultDict = JsonSerializer.Deserialize<TrainResponse>(temp);
                MLModel mLModel = new MLModel()
                {
                    simId=simId,
                    simulationInstance=s1,
                    model=resultDict.model,
                    tp=resultDict.tp,
                    tn=resultDict.tn,
                    fp=resultDict.fp,
                    fn=resultDict.fn,
                    trainStart=DateTime.SpecifyKind(rangeData.trainStart,DateTimeKind.Unspecified),
                    trainEnd= DateTime.SpecifyKind(rangeData.trainEnd, DateTimeKind.Unspecified),
                    testStart= DateTime.SpecifyKind(rangeData.testStart, DateTimeKind.Unspecified),
                    testEnd= DateTime.SpecifyKind(rangeData.testEnd, DateTimeKind.Unspecified),
                    validStart= DateTime.SpecifyKind(rangeData.validStart, DateTimeKind.Unspecified),
                    validEnd= DateTime.SpecifyKind(rangeData.validEnd, DateTimeKind.Unspecified)
                };
                datacontext.MLModels.Add(mLModel);
                datacontext.SaveChanges();
                return Ok(mLModel);

            }
            else
            {
                return StatusCode((int)response.StatusCode, "FastAPI processing failed.");
            }
        }

        [HttpPost("validate/{simId}")]
        [Consumes("multipart/form-data")]
        [Authorize]
        public async Task<IActionResult> ValidateCSV([FromForm] FileUpload upload,[FromRoute]int simId)
        {
            Dictionary<string, object> result = new Dictionary<string, object>();
            if (upload == null)
            {
                return BadRequest("upload is null");
            }

            var file = upload.file;
            if (file == null || file.Length == 0)
            {
                result.Add("error", "File not supported");
                return BadRequest(result);
            }
            UserLogin user = GetCurrentUser();
            SimulationInstance s1 = datacontext.Simulations.Include(s => s.user).Where(s => s.simId == simId).FirstOrDefault();
            //Console.WriteLine(user.username);
            if (s1 == null || s1.user.username != user.username)
            {
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

            
            using var httpClient = new HttpClient();
            using var content = new MultipartFormDataContent();
            var fileContent = new StreamContent(memoryStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");

            content.Add(fileContent, "valid_file", file.FileName);
            content.Add(fileContent, "train_file", "train.csv");
            //var csvString = datacontext.cSVFiles.Where(c => c.simId == s1.simId).FirstOrDefault().csvFile;
            //var csvBytes = Encoding.UTF8.GetBytes(csvString);
            //var trainMemoryStream = new MemoryStream(csvBytes); 
            //var trainfileContent = new StreamContent(trainMemoryStream);
            //trainfileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
            //content.Add(trainfileContent, "train_file", "train.csv");




            var response = await httpClient.PostAsync("http://host.docker.internal:6969/validatecsv", content);
            if (response.IsSuccessStatusCode)
            {
                var temp = await response.Content.ReadAsStringAsync();
               
                
                return Ok("validated Successfully");
            }
            else
            {
                return StatusCode((int)response.StatusCode, response.Content);
            }
        }

        [HttpGet("model/{simId}")]
        [Authorize]
        public IActionResult GetModel(int simId)
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
            MLModel m1=datacontext.MLModels.Where(m=>m.simId == simId).FirstOrDefault();
            if (m1 == null) {
                result.Add("error", "ML Model not found");
                return NotFound(result);
            }
            else
            {
                return Ok(m1);
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
