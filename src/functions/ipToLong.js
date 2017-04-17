export default function ipToLong(ip) {
  let ipl = 0;
  ip.split('.').forEach((octet) => {
    ipl <<= 8;
    ipl += parseInt(octet, 10);
  });
  return (ipl >>> 0);
}
