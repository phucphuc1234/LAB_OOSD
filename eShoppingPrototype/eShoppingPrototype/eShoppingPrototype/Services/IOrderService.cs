using eShoppingPrototype.Models;

namespace eShoppingPrototype.Services
{
    public interface IOrderService
    {
        bool TaoDonHang(DonDatHang donHang, out string message);
    }
}
