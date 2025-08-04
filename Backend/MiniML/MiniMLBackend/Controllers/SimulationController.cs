using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using MiniMLBackend.Dao;
using MiniMLBackend.Model;
using MiniMLBackend.Service;
using System.Security.Claims;

namespace MiniMLBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SimulationController : ControllerBase
    {
        private EF_DataContext datacontext;
        private SimulationInstanceService simulationService;
        private IMemoryCache memoryCache;
        private IConfiguration configuration;

        public SimulationController(EF_DataContext datacontext, SimulationInstanceService simulationService, IMemoryCache memoryCache, IConfiguration configuration)
        {
            this.datacontext = datacontext;
            this.simulationService = simulationService;
            this.memoryCache = memoryCache;
            this.configuration = configuration;
        }

        [HttpPost]
        [Authorize]
        public IActionResult AddSimulationInstance([FromBody] SimulationInstanceModel simulationInstanceModel)
        {
            UserLogin user = GetCurrentUser();
            Dictionary<string, object> result = simulationService.AddSimulationInstance(simulationInstanceModel, user.username);
            Dictionary<string, object> answer=new Dictionary<string, object>();
            foreach (string i in result.Keys) {
                if (i == "Success")
                {
                    answer.Add("message", "Simulation created successfully");
                    return Ok(answer);
                }
                else {
                    answer.Add("error", result[i]);
                    return BadRequest(answer);
                }
            }
            answer.Add("error","idk");
            return BadRequest(answer);

        }
        [HttpGet("simulations")]
        [Authorize]
        public IActionResult GetSimulationInstances()
        {
            UserLogin user = GetCurrentUser();
            Dictionary<string, object> result = new Dictionary<string, object>();

            List<SimulationInstance> sims = simulationService.GetSimulationInstances(user.username);
            return Ok(sims);

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
