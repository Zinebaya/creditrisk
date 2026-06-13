import stripe
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from config.config import settings
from services.db import DatabaseService

stripe.api_key = settings.STRIPE_SECRET_KEY

# Stripe product/price IDs (configure these in Stripe dashboard)
STRIPE_PRODUCTS = {
    "pro": {
        "price_id": "price_pro_monthly",  # Replace with actual Stripe price ID
        "name": "Professional",
        "amount": 29900,  # $299.00 in cents
        "billing_cycle": "monthly",
    },
    "enterprise": {
        "price_id": "price_enterprise_monthly",  # Replace with actual Stripe price ID
        "name": "Enterprise",
        "amount": 500000,  # 5,000.00 DA
        "billing_cycle": "monthly",
    },
}


class PaymentService:
    """Service for handling Stripe payment operations."""

    @staticmethod
    def create_checkout_session(
        user_email: str,
        plan_id: str,
        language: str = "en",
        return_url: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Create a Stripe checkout session for the given plan.

        Args:
            user_email: User's email address
            plan_id: Plan identifier ("pro" or "enterprise")
            language: User's language preference (for email)
            return_url: Custom return URL after successful payment

        Returns:
            Dict with checkout_url key

        Raises:
            ValueError: If plan_id is invalid or Stripe keys not configured
        """
        if not stripe.api_key:
            raise ValueError("Stripe API key not configured")

        if plan_id not in STRIPE_PRODUCTS:
            raise ValueError(f"Invalid plan: {plan_id}")

        if plan_id == "enterprise":
            raise ValueError("Enterprise plan requires manual setup. Contact sales.")

        product_info = STRIPE_PRODUCTS[plan_id]
        success_url = f"{settings.FRONTEND_URL}/{language}/dashboard/billing?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{settings.FRONTEND_URL}/{language}/dashboard/billing?canceled=true"

        if return_url:
            success_url = return_url

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": product_info["price_id"],
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=user_email,
                metadata={
                    "plan_id": plan_id,
                    "user_email": user_email,
                    "language": language,
                },
            )
            return {"checkout_url": session.url, "session_id": session.id}
        except stripe.error.StripeError as e:
            raise ValueError(f"Stripe error: {str(e)}")

    @staticmethod
    def handle_checkout_session_completed(session_id: str, db: DatabaseService) -> bool:
        """
        Handle checkout session completion webhook.

        Args:
            session_id: Stripe checkout session ID
            db: Database service instance

        Returns:
            True if successful
        """
        try:
            session = stripe.checkout.Session.retrieve(session_id)

            if session.payment_status != "paid":
                return False

            user_email = session.customer_email or session.metadata.get("user_email")
            plan_id = session.metadata.get("plan_id", "pro")

            if not user_email:
                raise ValueError("No customer email found in session")

            # Update user subscription in database
            user = db.get_user_model_by_email(user_email)
            if not user:
                raise ValueError(f"User not found: {user_email}")

            # Calculate subscription expiry (30 days from now for monthly)
            expires_at = datetime.utcnow() + timedelta(days=30)

            db.update_user_subscription(
                user.id,
                subscription_status="active",
                plan_tier=plan_id,
                stripe_customer_id=session.customer,
                stripe_subscription_id=session.subscription,
                subscription_expires_at=expires_at,
            )

            return True
        except Exception as e:
            print(f"Error handling checkout completion: {str(e)}")
            return False

    @staticmethod
    def handle_customer_subscription_updated(
        subscription_id: str, db: DatabaseService
    ) -> bool:
        """Handle subscription update webhook (renewal, upgrade, etc.)."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            customer = stripe.Customer.retrieve(subscription.customer)

            user_email = customer.email
            if not user_email:
                raise ValueError("No customer email found")

            user = db.get_user_model_by_email(user_email)
            if not user:
                raise ValueError(f"User not found: {user_email}")

            # Extract plan from subscription items
            plan_id = "pro"  # Default to pro (customize based on your setup)
            if subscription.items.data:
                plan_id = subscription.items.data[0].metadata.get("plan_id", "pro")

            # Calculate next renewal date
            current_period_end = datetime.fromtimestamp(
                subscription.current_period_end
            )

            db.update_user_subscription(
                user.id,
                subscription_status="active",
                plan_tier=plan_id,
                stripe_subscription_id=subscription_id,
                subscription_expires_at=current_period_end,
            )

            return True
        except Exception as e:
            print(f"Error handling subscription update: {str(e)}")
            return False

    @staticmethod
    def handle_customer_subscription_deleted(
        subscription_id: str, db: DatabaseService
    ) -> bool:
        """Handle subscription cancellation webhook."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            customer = stripe.Customer.retrieve(subscription.customer)

            user_email = customer.email
            if not user_email:
                raise ValueError("No customer email found")

            user = db.get_user_model_by_email(user_email)
            if not user:
                raise ValueError(f"User not found: {user_email}")

            db.update_user_subscription(
                user.id,
                subscription_status="canceled",
                plan_tier="free",
                subscription_expires_at=None,
            )

            return True
        except Exception as e:
            print(f"Error handling subscription deletion: {str(e)}")
            return False
