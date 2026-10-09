using System;
namespace TravelManager.Models {
 public sealed class BookingRequest { public int TourId, CustomerId, Headcount; public int? TripId; public string Type, AgencyName, Representative, Pickup, Phone; public DateTime Departure; public decimal Deposit; public bool Insurance; public string InsuredNames; }
 public sealed class AssignmentRequest { public int StaffId, BookingId; public decimal TourWage; }
 public sealed class PaymentRequest { public int BookingId; public decimal Amount; public string Kind; }
 public sealed class SurveyRequest { public int BookingId, Rating; public string Feedback; }
}
