using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
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

            var response = await httpClient.PostAsync($"{configuration["Origins:ml"]}/rangedata", content);
            if (response.IsSuccessStatusCode)
            {
                var temp = await response.Content.ReadAsStringAsync();
                RangeResponse resultDict = JsonSerializer.Deserialize<RangeResponse>(temp);
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

            var response = await httpClient.PostAsync($"{configuration["Origins:ml"]}/trainmodel", content);
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
                MLModel thala=datacontext.MLModels.Where(m=>m.simId==simId).FirstOrDefault();
                if (thala != null) {
                    datacontext.MLModels.Remove(thala);
                }
                datacontext.MLModels.Add(mLModel);
                datacontext.SaveChanges();
                return Ok(resultDict);

            }
            else
            {
                return StatusCode((int)response.StatusCode, "FastAPI processing failed.");
            }
        }

        [HttpPost("validate/{simId}")]
        [Consumes("multipart/form-data")]
        [Authorize]
        public async Task<IActionResult> ValidateCSV([FromForm]FileUpload upload,[FromRoute]int simId)
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
            //content.Add(fileContent, "train_file", "train.csv");
            var csvString = datacontext.cSVFiles.Where(c => c.simId == s1.simId).FirstOrDefault().csvFile;
            var csvBytes = Encoding.UTF8.GetBytes(csvString);
            var trainMemoryStream = new MemoryStream(csvBytes);
            var trainfileContent = new StreamContent(trainMemoryStream);
            trainfileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
            content.Add(trainfileContent, "train_file", "train.csv");




            var response = await httpClient.PostAsync($"{configuration["Origins:ml"]}/validatecsv", content);
            if (response.IsSuccessStatusCode)
            {
                var temp = await response.Content.ReadAsStringAsync();
               
                
                return Ok("validated Successfully");
            }
            else
            {
                return StatusCode((int)response.StatusCode,"CSV files do not match");
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

        [HttpPost("validationresult/{simId}")]
        [Authorize]
        public async Task GetValidationResult(int simId)
        {
            Response.ContentType = "text/event-stream";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["X-Accel-Buffering"] = "no";
            Response.Headers["Connection"] = "keep-alive";
            HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();
            Dictionary<string, object> result = new Dictionary<string, object>();
            UserLogin user = GetCurrentUser();
            SimulationInstance s1 = datacontext.Simulations.Include(s => s.user).Where(s => s.simId == simId).FirstOrDefault();
            //Console.WriteLine(user.username);
            if (s1 == null || s1.user.username != user.username)
            {
                await WriteSSEAsync(new { error = "Invalid file" });
                return;
            }

            MLModel m1 = datacontext.MLModels.Where(m => m.simId == simId).FirstOrDefault();
            if (m1 == null)
            {
                await WriteSSEAsync(new { error = "Model not found" });
                return;
            }



            var csvString = datacontext.cSVFiles.Where(c => c.simId == s1.simId).FirstOrDefault().csvFile;
            var csvBytes = Encoding.UTF8.GetBytes(csvString);
            var memoryStream = new MemoryStream(csvBytes); 

            using var client = new HttpClient();
            using var content = new MultipartFormDataContent();

            var fileContent = new StreamContent(memoryStream);
            using var httpClient = new HttpClient();

            fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");

            // "file" is the key FastAPI will look for
            content.Add(fileContent, "file", "data.csv");
            
            content.Add(new StringContent(m1.model), "model");
            
            content.Add(new StringContent(m1.validStart.ToString("o")), "validStart");
            content.Add(new StringContent(m1.validEnd.ToString("o")), "validEnd");
            var request = new HttpRequestMessage(HttpMethod.Post, $"{configuration["Origins:ml"]}/resultvalidation")
            {
                Content = content
            };

            using var response = await client.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                HttpContext.RequestAborted);
            if (!response.IsSuccessStatusCode)
            {
                await WriteSSEAsync(new { error = "FastAPI error", status = response.StatusCode });
                return;
            }
            var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);
            var body = await reader.ReadToEndAsync();



            var items = JsonSerializer.Deserialize<List<Dictionary<string,object>>>(body);

            if (items != null)
            {
                foreach (var item in items)
                {
                    var json = JsonSerializer.Serialize(item);
                    var sse = $"data: {json}\n\n";

                    await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(sse));
                    await Response.Body.FlushAsync();

                    await Task.Delay(500); // simulate delay per message
                }
            }

            // Helper methods
            async Task WriteSSEAsync(object obj)
            {
                var json = JsonSerializer.Serialize(obj);
                var sse = $"data: {json}\n\n";
                await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(sse));
                await Response.Body.FlushAsync();
            }

            async Task WriteRawSSEAsync(string line)
            {
                var sse = $"data: {line}\n\n";
                await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(sse));
                await Response.Body.FlushAsync();
            }
        }

        [HttpPost("predictstream/{simId}")]
        [Consumes("multipart/form-data")]
        [Authorize]
        public async Task GetOutputStream([FromForm] FileUpload upload, [FromRoute] int simId)
        {
            Response.ContentType = "text/event-stream";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["X-Accel-Buffering"] = "no";
            Response.Headers["Connection"] = "keep-alive";
            HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();

            if (upload == null || upload.file == null || upload.file.Length == 0)
            {
                await WriteSSEAsync(new { error = "Invalid file" });
                return;
            }

            var user = GetCurrentUser();
            var s1 = datacontext.Simulations
                .Include(s => s.user)
                .FirstOrDefault(s => s.simId == simId);

            if (s1 == null || s1.user.username != user.username)
            {
                await WriteSSEAsync(new { error = "Unauthorized" });
                return;
            }
            string mlModel=datacontext.MLModels.Where(m=>m.simId==simId).FirstOrDefault().model;
            if (mlModel==null)
            {
                await WriteSSEAsync(new { error = "Model not found" });
                return;
            }
            using var client = new HttpClient();
            using var memoryStream = new MemoryStream();
            await upload.file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            using var content = new MultipartFormDataContent();
            var fileContent = new StreamContent(memoryStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
            content.Add(fileContent, "file", upload.file.FileName);
            content.Add(new StringContent(mlModel), "model");

            var request = new HttpRequestMessage(HttpMethod.Post, $"{configuration["Origins:ml"]}/predictstream")
            {
                Content = content
            };

            using var response = await client.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                HttpContext.RequestAborted);
            if (!response.IsSuccessStatusCode)
            {
                await WriteSSEAsync(new { error = "FastAPI error", status = response.StatusCode });
                return;
            }
            

            var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream && !HttpContext.RequestAborted.IsCancellationRequested)
            {
                
                var line = await reader.ReadLineAsync();
                if (!string.IsNullOrWhiteSpace(line))
                {
                    await WriteRawSSEAsync(line);
                }
            }

            // Helper methods
            async Task WriteSSEAsync(object obj)
            {
                var json = JsonSerializer.Serialize(obj);
                var sse = $"data: {json}\n\n";
                await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(sse));
                await Response.Body.FlushAsync();
            }

            async Task WriteRawSSEAsync(string line)
            {
                var sse = $"data: {line}\n\n";
                await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(sse));
                await Response.Body.FlushAsync();
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
