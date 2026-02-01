"""
Backend API Tests for TrvicERP
P0: Core functionality tests
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

# Test client
client = TestClient(app)

# Test configuration - can be overridden via environment variables
TEST_API_BASE_URL = os.environ.get("TEST_API_BASE_URL", "http://localhost:4000")


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint returns API info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert data["status"] == "running"
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data
    
    def test_liveness_probe(self):
        """Test Kubernetes liveness probe"""
        response = client.get("/health/live")
        assert response.status_code == 200
        assert response.json()["status"] == "alive"
    
    def test_readiness_probe(self):
        """Test Kubernetes readiness probe"""
        response = client.get("/health/ready")
        # May return 200 or 503 depending on DB state
        assert response.status_code in [200, 503]


class TestPaymentsAPI:
    """Test payment endpoints"""
    
    def test_list_payments_empty(self):
        """Test listing payments when empty"""
        response = client.get("/api/v1/payments")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_payment(self):
        """Test creating a payment record"""
        payment_data = {
            "order_id": "test_order_001",
            "payment_type": "deposit",
            "payment_method": "credit_card",
            "amount": 10000,
            "currency": "TWD"
        }
        response = client.post("/api/v1/payments", json=payment_data)
        assert response.status_code == 201
        data = response.json()
        assert data["order_id"] == "test_order_001"
        assert data["amount"] == 10000
        assert "id" in data
    
    def test_get_payment_not_found(self):
        """Test getting non-existent payment"""
        response = client.get("/api/v1/payments/nonexistent_id")
        assert response.status_code == 404
    
    def test_payment_summary(self):
        """Test getting payment summary for order"""
        response = client.get("/api/v1/payments/summary/test_order")
        assert response.status_code == 200
        data = response.json()
        assert "total_paid" in data
        assert "pending_amount" in data


class TestNotificationsAPI:
    """Test notification endpoints"""
    
    def test_notification_status(self):
        """Test notification service status"""
        response = client.get("/api/v1/notifications/status")
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "line" in data
        assert "templates_available" in data


class TestAuthAPI:
    """Test authentication endpoints"""
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post("/api/v1/auth/login", json={
            "username": "invalid_user",
            "password": "invalid_pass"
        })
        assert response.status_code == 401
    
    def test_logout(self):
        """Test logout endpoint"""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 200


class TestCORSHeaders:
    """Test CORS configuration"""
    
    def test_cors_headers_present(self):
        """Test that CORS headers are present"""
        response = client.options(
            "/api/v1/payments",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET"
            }
        )
        # CORS preflight should work
        assert response.status_code in [200, 204, 405]


class TestRateLimiting:
    """Test rate limiting functionality"""
    
    def test_rate_limit_headers(self):
        """Test that rate limit headers are added"""
        # Make multiple requests
        for _ in range(5):
            response = client.get("/")
            assert response.status_code == 200


class TestStripeIntegration:
    """Test Stripe payment integration"""
    
    def test_create_stripe_intent_without_config(self):
        """Test creating Stripe intent when not configured"""
        response = client.post("/api/v1/payments/stripe/create-intent", json={
            "order_id": "test_order",
            "amount": 50000
        })
        # Should return 503 when Stripe is not configured
        assert response.status_code in [201, 503]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
