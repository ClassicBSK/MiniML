using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MiniMLBackend.Dao;
using MiniMLBackend.Model;
using MiniMLBackend.Service;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MiniMLBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private IConfiguration _configuration;
        private EF_DataContext datacontext;
        private UserService userService;

        public UserController(IConfiguration configuration,
            EF_DataContext datacontext,
            UserService userService
            )
        {
            this._configuration = configuration;
            this.datacontext = datacontext;
            this.userService = userService;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult LoginBoy([FromBody] UserLogin userLogin)
        {
            var user = Authenticate(userLogin);
            if (user != null)
            {
                var token = Generate(user);
                return Ok(token);
            }
            return NotFound(user);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public ActionResult<User> registerUser([FromBody] UserLogin user)
        {
            //Console.WriteLine(user.username);
            User u1 = userService.RegisterUser(user);
            if (u1 == null)
            {
                return BadRequest("User already exists");
            }
            return Ok(u1);


        }
        private string Generate(UserLogin user)
        {

            var secretKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:key"]));
            var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier,user.username)
            };
            var token = new JwtSecurityToken(
                    _configuration["Jwt:Issuer"],
                    _configuration["Jwt:Audience"],
                    claims,
                    expires: DateTime.Now.AddMinutes(10),
                    signingCredentials: credentials);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private UserLogin Authenticate(UserLogin userLogin)
        {
            var hasher = new PasswordHasher<UserLogin>();
            var secretKey = _configuration["Jwt:key"];

            var userpass = userService.HashWithKey(userLogin.password);
            var user = datacontext.Users.Where(o => o.username == userLogin.username && userpass == o.password).FirstOrDefault();
            //throw new NotImplementedException();
            if (user != null)
            {
                return new UserLogin
                {
                    username = user.username,
                    password = user.password,
                };
            }
            return null;
        }

    }
}
