import { sub } from "date-fns";
import * as Types from "../POSWindow/POSTypes";
import moment from "moment-timezone";


  // Function signature with types applied
  export const processSubscriptionData = (
    subscriptionData: Types.Subscription,
    member: Types.Member
  ): Types.Member => {
    // Function to find the subscription item corresponding to the member
    const findMemberItem = (subscriptionData, member) => {
      // Iterate over the items
      console.log("seal selling plan id", member._seal_selling_plan_id, member);
  
      if (subscriptionData.items.length === 1) {
        console.log("single item", subscriptionData.items[0]);
        return subscriptionData.items[0];
      }
      console.log('checking for matching selling plan id from items:',subscriptionData.items);
      console.log('member info to compare:', member);
      for (const item of subscriptionData.items) {
        if (member._seal_selling_plan_id) {
          const selling_plan_id = item.selling_plan_id;
          if (selling_plan_id === member._seal_selling_plan_id) {
            return item;
          }
        }
      }
  
      // if no item found that way, check for matching name property
      for (const item of subscriptionData.items) {
        for (const property of item.properties) {
          const normalize = (str) =>
            str
              .toLowerCase()
              .replace(/[^\w\s]/gi, "")
              .replace(/\s/g, "");
  
          if (
            property.key.includes("ame") &&
            normalize(property.value) == normalize(member.name)
          ) {
            return item;
          }
        }
      }
  
      return null; // Item not found
    };
  
    // Helper function to calculate the number of months between two dates
    function monthDiff(d1, d2) {
      let months;
      months = (d2.getFullYear() - d1.getFullYear()) * 12;
      months -= d1.getMonth();
      months += d2.getMonth();
      return months <= 0 ? 0 : months;
    }
  
    console.log("Subscription data:", subscriptionData);
    if (!subscriptionData) {
      console.log("No subscription data");
      return {};
    }
  
    const updatedData : Types.Member = {};
  
    // Initialize variables
    let payments_remaining = null;
    let payment_amount = null;
    let next_payment = null;
  
    // Find the item corresponding to the member
    const memberItem = findMemberItem(subscriptionData, member);
  
    if (!memberItem) {
      console.log(`No matching item found for member ${member.name}`);
      return {}; // Handle as needed, maybe set default values or skip updating
    }
  
    const orderPlacedDate = new Date(subscriptionData.order_placed);
  
    // Find the last successful billing attempt
    const successfulAttempts = subscriptionData.billing_attempts.filter(
      (attempt) => attempt.status === "completed"
    );
  
    const lastSuccessAttempt = successfulAttempts.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  
    // If there are no successful payments, use the signup date
    const lastPaymentDate = lastSuccessAttempt
      ? new Date(lastSuccessAttempt.date)
      : orderPlacedDate;
  
    // **Signup date**
    let signup_date = orderPlacedDate.toISOString();
  
    const startDate = member.contract_start_date;
  
    if (startDate < signup_date) {
      signup_date = startDate;
    }
  
    let valid_starting;
    let isRoundToJan1 = false;

    if (member.valid_starting) {
      console.log("member.valid_starting exists", member.valid_starting);
      valid_starting = moment(member.valid_starting); // Create Moment object
      // Check if valid_starting equals Jan 1 in UTC
      if (valid_starting.utc().date() === 1 && valid_starting.utc().month() === 0) {
        isRoundToJan1 = true;
        console.log("valid_starting is Jan 1 (UTC)", isRoundToJan1);
      } else {
        console.log(
          "valid_starting is not Jan 1 (UTC)",
          isRoundToJan1,
          valid_starting.utc().date(),
          valid_starting.utc().month()
        );
      }
    } else {
      console.log("member.valid_starting does not exist", memberItem.title);
      valid_starting = moment(orderPlacedDate); // Initialize as Moment object
      for (const property of memberItem.properties) {
        if (property.key === "_seal_selling_plan_name") {
          if (property.value.includes("January 1")) {
            valid_starting = moment.utc(orderPlacedDate).add(1, "year").startOf("year");
            isRoundToJan1 = true;
          }
        }
      }
    
      if (memberItem.title.includes("January 1")) {
        valid_starting = moment.utc(orderPlacedDate).add(1, "year").startOf("year");
        isRoundToJan1 = true;
      }
    }
    
    console.log("valid starting (UTC): ", valid_starting);
    
    // Calculate valid_until
    let valid_until = new Date(lastPaymentDate);
  
    if (subscriptionData.billing_interval.includes("month")) {
      valid_until.setMonth(valid_until.getMonth() + 1);
    } else if (subscriptionData.billing_interval.includes("year")) {
      if (isRoundToJan1) {
        console.log('rounding to jan 1 from',valid_until);
        valid_until = new Date(valid_until.getFullYear() + 2, 0, 1);
      }else{
        valid_until.setFullYear(valid_until.getFullYear() + 1);
      }
    }
    console.log('valid until: ',valid_until)

  
    if (new Date(member.valid_until) > valid_until) {
      valid_until = new Date(member.valid_until);
    }
  
    // Initialize total_paid and totalPaymentsMade
    let total_paid = 0;
    console.log('total paid: ',total_paid)
    let totalPaymentsMade = 0;
    const cutoffDate = new Date("2023-04-28"); // 4/28/2023
  
    const signupDate = new Date(signup_date);
  
    // Determine if order_placed is before 4/28/2023
    if (signupDate < cutoffDate) {
      // **Special Case Handling**
  
      // **Initial Payment**
      const initialPrice = 27.99; // Assumed initial payment
      total_paid += initialPrice;
      console.log('total paid with initial: ',total_paid)

      totalPaymentsMade += 1;
  
      // **Calculate Months Before Cutoff**
      const monthsBeforeCutoff = monthDiff(signupDate, cutoffDate);
  
      // **Assumed Monthly Payments Before 4/28/2023**
      // Exclude the initial payment month
      const extraPayments = monthsBeforeCutoff - 1; // -1 because initial payment is already counted
  
      // **Determine Cycle Price**
      let cyclePrice = null;
      if (memberItem.cycle_discounts && memberItem.cycle_discounts.length > 0) {
        // Find the computed_price for after_cycle == 1
        const discount = memberItem.cycle_discounts.find(
          (discount) => discount.after_cycle === 1
        );
        if (discount) {
          cyclePrice = parseFloat(discount.computed_price);
        }
      }
      if (cyclePrice === null) {
        cyclePrice = parseFloat(memberItem.final_price) || 0;
      }
  
      // **Add Payments Before Cutoff**
      if (extraPayments > 0) {
        total_paid += extraPayments * cyclePrice;
        console.log('total paid with extra payments: ',total_paid)

        totalPaymentsMade += extraPayments;
      }
  
      // **Process Successful Billing Attempts After 4/28/2023**
      successfulAttempts.forEach(() => {
        // The cycleNumber is totalPaymentsMade + 1
        const cycleNumber = totalPaymentsMade + 1;
  
        let paymentPrice = null;
  
        if (memberItem.cycle_discounts && memberItem.cycle_discounts.length > 0) {
          // Find the applicable cycle discount for the current cycle
          for (let i = memberItem.cycle_discounts.length - 1; i >= 0; i--) {
            if (cycleNumber >= memberItem.cycle_discounts[i].after_cycle + 1) {
              paymentPrice = parseFloat(
                memberItem.cycle_discounts[i].computed_price
              );
              break;
            }
          }
        }
  
        if (paymentPrice === null) {
          paymentPrice = parseFloat(memberItem.final_price) || 0;
        }
  
        total_paid += paymentPrice;
        console.log('total paid with another payment: ',total_paid)

        totalPaymentsMade += 1;
      });
    } else {
      // **Order Placed After 4/28/2023, Proceed as Before**
  
      // **Initial Payment**
      let initialPrice = null;
  
      if (memberItem.cycle_discounts && memberItem.cycle_discounts.length > 0) {
        // Find the computed_price for after_cycle == 0
        const initialDiscount = memberItem.cycle_discounts.find(
          (discount) => discount.after_cycle === 0
        );
        if (initialDiscount) {
          initialPrice = parseFloat(initialDiscount.computed_price);
        }
      }
  
      if (initialPrice === null) {
        initialPrice = parseFloat(memberItem.price) || 0;
      }
  
      total_paid += initialPrice;
      console.log('total paid initial: ',total_paid)

      totalPaymentsMade += 1;
  
      // **Process Successful Billing Attempts**
      successfulAttempts.forEach(() => {
        // The cycleNumber is totalPaymentsMade + 1
        const cycleNumber = totalPaymentsMade + 1;
  
        let cyclePrice = null;
  
        if (memberItem.cycle_discounts && memberItem.cycle_discounts.length > 0) {
          // Find the applicable cycle discount for the current cycle
          for (let i = memberItem.cycle_discounts.length - 1; i > 0; i--) {
            if (cycleNumber >= memberItem.cycle_discounts[i].after_cycle + 1) {
              cyclePrice = parseFloat(
                memberItem.cycle_discounts[i].computed_price
              );
              console.log('discoved cycle price: ',cyclePrice)
              break;
            }
          }
        }
  
        if (cyclePrice === null) {
          cyclePrice = parseFloat(memberItem.final_price) || 0;
        }
        console.log('default cycle price: ',cyclePrice)

        console.log('total paid with cycle price: ',total_paid,cyclePrice)

        total_paid += cyclePrice;
        totalPaymentsMade += 1;
      });
    }
  
    total_paid = Math.round(total_paid * 100) / 100; // Round to 2 decimal places
    console.log('total paid rounded: ',total_paid)

    // **Calculate payments_remaining**
    const billingMinCycles = parseInt(subscriptionData.billing_min_cycles) || 0;
  
    if (billingMinCycles > 0) {
      payments_remaining = billingMinCycles - totalPaymentsMade;
    } else {
      payments_remaining = null;
    }
  
    // **Determine next_payment**
    const lastCompletedAttemptIndex = subscriptionData.billing_attempts
      .map((attempt) => attempt.status)
      .lastIndexOf("completed");
  
    const upcomingAttempts = subscriptionData.billing_attempts.slice(
      lastCompletedAttemptIndex + 1
    );
  
    const nextAttempt = upcomingAttempts.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];
  
    next_payment = nextAttempt ? new Date(nextAttempt.date).toISOString() : null;
  
    // **Calculate payment_amount for this member**
    const taxRate = 1.0825; // Adjust if necessary
  
    const nextCycleNumber = totalPaymentsMade + 1; // Next cycle number
    let nextCyclePrice = null;
  
    if (memberItem.cycle_discounts && memberItem.cycle_discounts.length > 0) {
      // Find the applicable cycle discount for the next cycle
      for (let i = memberItem.cycle_discounts.length - 1; i >= 0; i--) {
        if (nextCycleNumber >= memberItem.cycle_discounts[i].after_cycle + 1) {
          nextCyclePrice = parseFloat(
            memberItem.cycle_discounts[i].computed_price
          );
          break;
        }
      }
    }
  
    if (nextCyclePrice === null) {
      nextCyclePrice = parseFloat(memberItem.final_price) || 0;
    }
  
    payment_amount = (nextCyclePrice * taxRate).toFixed(2);
  
    // **Extract email and billing address**
    const email = subscriptionData.email || member.email;
  
    const address_line_1 = [
      subscriptionData.b_address1 || subscriptionData.s_address1,
      subscriptionData.b_address2 || subscriptionData.s_address2,
    ]
      .filter(Boolean) // Remove undefined or empty strings
      .join(" ");
  
    const city_state_zip = [
      subscriptionData.b_city || subscriptionData.s_city,
      subscriptionData.b_province || subscriptionData.s_province,
      subscriptionData.b_zip || subscriptionData.s_zip,
    ]
      .filter(Boolean)
      .join(", ");
    

    //print valid until and valid until string
    console.log('valid until from processSubData: ',valid_until);
    console.log('valid until string: ',valid_until.toISOString().split('T')[0]);

    // **Update updatedData with calculated and extracted values**
    updatedData.valid_until_string = valid_until.toISOString().split('T')[0];
    updatedData.valid_until = valid_until;
    updatedData.signup_date = signupDate;
    updatedData.signup_date_string = signup_date.split('T')[0];
    updatedData.payments_remaining =
      payments_remaining > 0 ? payments_remaining : null;
    updatedData.payment_amount = payment_amount;
    updatedData.due_date = next_payment;
    updatedData.total_paid = total_paid;
    updatedData.email = email;
    updatedData.address_line_1 = address_line_1 || member.address_line_1;
    updatedData.city_state_zip = city_state_zip || member.city_state_zip;
    updatedData.term = subscriptionData.delivery_interval;
    updatedData.status = subscriptionData.status;
    updatedData.customer_id = subscriptionData.customer_id;
    updatedData.valid_starting = valid_starting.toDate();
    updatedData.valid_starting_string = valid_starting.utc().format("YYYY-MM-DD");
    updatedData.payment_amount = payment_amount;
    updatedData.edit_url = subscriptionData.edit_url;
  
    return updatedData;
};
  