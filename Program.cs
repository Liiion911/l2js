using System;
using System.Collections.Generic;
//using System.Linq;
using System.Text;
//using System.Threading.Tasks;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Generators;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Math;
using Org.BouncyCastle.Security;
using Org.BouncyCastle.OpenSsl;
using Newtonsoft.Json;
using System.IO;
using Org.BouncyCastle.Crypto.Engines;
using System.Security.Cryptography;

namespace RSAGenerator
{
    public class KeysModel
    {
        public string _privateKey { get; set; }
        public string _publicKey { get; set; }
        public byte[] _scrambledModulus { get; set; }
        public byte[] base64authString { get; set; }
        public string login { get; set; }
        public string pass { get; set; }
    }

    class Program
    {

        static void Main(string[] args)
        {

            if (args.Length >= 2)
            {
                string action = args[0];
                string fileName = args[1];
                switch (action)
                {
                    case "key":

                        AsymmetricCipherKeyPair pPair = genKeyPair();
                        AsymmetricKeyParameter _publicKey = pPair.Public;
                        byte[] _scrambledModulus = scrambleModulus((_publicKey as RsaKeyParameters).Modulus);
                        AsymmetricKeyParameter _privateKey = pPair.Private;

                        TextWriter textWriterPvt = new StringWriter();
                        PemWriter pemWriterPvt = new PemWriter(textWriterPvt);
                        pemWriterPvt.WriteObject(_privateKey);
                        pemWriterPvt.Writer.Flush();

                        string privateKeyString = textWriterPvt.ToString();

                        TextWriter textWriterPub = new StringWriter();
                        PemWriter pemWriterPub = new PemWriter(textWriterPub);
                        pemWriterPub.WriteObject(_publicKey);
                        pemWriterPub.Writer.Flush();

                        string publicKeyString = textWriterPub.ToString();

                        var keys = new KeysModel()
                        {
                            _privateKey = privateKeyString,
                            _publicKey = publicKeyString,
                            _scrambledModulus = _scrambledModulus,
                            base64authString = new byte[0],
                            login = "",
                            pass = "",
                        };


                        string json = JsonConvert.SerializeObject(keys);
                        System.IO.File.WriteAllText(@"./RSAgenerator/keys/" + fileName + ".json", json);

                        Console.Write("Generated: " + fileName);

                        break;

                    case "decode":

                        var newKeys =
                            JsonConvert.DeserializeObject<KeysModel>(
                                File.ReadAllText(@"./RSAgenerator/keys/" + fileName + ".json"));

                        string username = "";
                        string password = "";

                        using (var txtreader = new StringReader(newKeys._privateKey))
                        {
                            var newKeyPair = (AsymmetricCipherKeyPair) new PemReader(txtreader).ReadObject();
                            RsaEngine rsaEng = new RsaEngine();
                            rsaEng.Init(false, newKeyPair.Private);
                            byte[] decryptBuff = rsaEng.ProcessBlock(newKeys.base64authString, 0, 128);
                            if (decryptBuff.Length <= 128)
                            {
                                byte[] temp = new byte[128];
                                Array.Copy(decryptBuff, 0, temp, 128 - decryptBuff.Length, decryptBuff.Length);
                                decryptBuff = temp;
                            }

                            username = PrepareString(Encoding.ASCII.GetString(decryptBuff, 0x5E, 14).ToLower());
                            password = PrepareString(Encoding.ASCII.GetString(decryptBuff, 0x6C, 16));

                            newKeys.login = username;
                            newKeys.pass = password;

                        }

                        string newJson = JsonConvert.SerializeObject(newKeys);
                        System.IO.File.WriteAllText(@"./RSAgenerator/keys/" + fileName + ".json", newJson);

                        Console.Write("Decoded: " + fileName);

                        break;

                    default:

                        Console.Write("not found action!");
                        Console.ReadLine();

                        break;

                }
            }
            else
            {
                
                Console.Write("no action!");
                Console.ReadLine();
                        
            }
        }

        public static string PrepareString(string Value)
        {
            string newStr = "";
            for (short i = 0; i < Value.Length - 1; i++)
            {
                if (char.IsLetterOrDigit(Value[i]))
                    newStr += Value[i];
            }
            return newStr;
        }

        public static AsymmetricCipherKeyPair genKeyPair()
        {
            SecureRandom rnd = new SecureRandom();
            RsaKeyGenerationParameters par = new RsaKeyGenerationParameters(BigInteger.ValueOf(65537), rnd, 1024, 10);
            RsaKeyPairGenerator gen = new RsaKeyPairGenerator();
            gen.Init(par);
            AsymmetricCipherKeyPair keys = gen.GenerateKeyPair();
            return keys;
        }

        public static byte[] scrambleModulus(BigInteger modulus)
        {
            byte[] fScrambledModulus = modulus.ToByteArray();

            if (fScrambledModulus.Length == 0x81 && fScrambledModulus[0] == 0)
            {
                byte[] temp = new byte[0x80];
                Array.Copy(fScrambledModulus, 1, temp, 0, 0x80);
                fScrambledModulus = temp;
            }

            // step 1 0x4d-0x50  <-> 0x00-0x04
            for (int i = 0; i < 4; i++)
            {
                byte temp = fScrambledModulus[i];
                fScrambledModulus[i] = fScrambledModulus[0x4d + i];
                fScrambledModulus[0x4d + i] = temp;
            }

            // step 2   xor  first 0x40 bytes with  last 0x40 bytes
            for (int i = 0; i < 0x40; i++)
                fScrambledModulus[i] = (byte)(fScrambledModulus[i] ^ fScrambledModulus[0x40 + i]);

            // step 3  xor  bytes 0x0d-0x10 with bytes 0x34-0x38
            for (int i = 0; i < 4; i++)
                fScrambledModulus[0x0d + i] = (byte)(fScrambledModulus[0x0d + i] ^ fScrambledModulus[0x34 + i]);

            // step 4   xor  last 0x40 bytes with  first 0x40 bytes
            for (int i = 0; i < 0x40; i++)
                fScrambledModulus[0x40 + i] = (byte)(fScrambledModulus[0x40 + i] ^ fScrambledModulus[i]);

            return fScrambledModulus;
        }
    }
}
