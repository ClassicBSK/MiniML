using Microsoft.AspNetCore.Identity;
using MiniMLBackend.Dao;
using MiniMLBackend.Model;
using System.Security.Cryptography;
using System.Text;

namespace MiniMLBackend.Service
{
    public class UserService
    {
        private IConfiguration _configuration;
        private EF_DataContext datacontext;

        public UserService(EF_DataContext datacontext, IConfiguration configuration)
        {
            this.datacontext = datacontext;
            this._configuration = configuration;
        }
        public User RegisterUser(UserLogin user)
        {
            //User u1 = datacontext.Users.Where(o1 => o1.username == user.username).FirstOrDefault();
            User u1 = null;
            var hasher = new PasswordHasher<User>();
            Console.WriteLine(u1+"----");
            if (u1 == null)
            {
                //Console.WriteLine("enters u1!=null");
                u1 = new User()
                {
                    username = user.username,
                    password = HashWithKey(user.password),
                };

                datacontext.Users.Add(u1);
                datacontext.SaveChanges();
                return u1;
            }
            return null;

        }
        public string HashWithKey(string password)
        {
            string secretKey = _configuration["Jwt:key"];
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var passwordBytes = Encoding.UTF8.GetBytes(password);

            using var hmac = new HMACSHA256(keyBytes);
            var hashBytes = hmac.ComputeHash(passwordBytes);
            return Convert.ToBase64String(hashBytes);
        }
        public bool Match(string password, string storedHash)
        {
            var newHash = HashWithKey(password);
            return newHash == storedHash;
        }
    }
}
