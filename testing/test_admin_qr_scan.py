import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait

class TestAdminQRScan():
    def setup_method(self, method):
        self.driver = webdriver.Chrome()
        self.driver.implicitly_wait(10)
        self.vars = {}
    
    def teardown_method(self, method):
        self.driver.quit()
    
    def test_admin_qr_scan(self):
        # Default Vite React dev server port is 5173
        self.driver.get("http://localhost:5173/")
        self.driver.set_window_size(1280, 800)
        
        wait = WebDriverWait(self.driver, 10)
        
        # 1. Login using Demo Admin preset
        demo_admin_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Demo Admin')]")))
        demo_admin_btn.click()
        
        submit_btn = self.driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        
        # 2. Click on 'Quick QR Check-In' in the header
        # First, wait for the login toast notification to disappear to avoid ElementClickInterceptedException
        wait.until_not(EC.presence_of_element_located((By.XPATH, "//div[contains(@style, 'z-index: 9999')]")))
        
        qr_checkin_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[span[contains(text(), 'Quick QR Check-In')]]")))
        qr_checkin_btn.click()
        
        # 3. Enter Booking ID in the manual input form inside QRCheckInModal
        verify_input = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[contains(@placeholder, 'SPV-BK')]")))
        verify_input.send_keys("TEST-QR-1234")
        
        verify_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Verify')]")
        verify_btn.click()
        
        # 4. Confirm the Check-In after the match is found
        confirm_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[span[contains(text(), 'Confirm Player Check-In')]]")))
        time.sleep(0.5) # Slight wait for re-render / animation
        confirm_btn.click()
        
        # 5. Verify the success message
        success_msg = wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), 'Check-in confirmed')]")))
        assert success_msg is not None

        # Give it a moment to dismiss
        time.sleep(2)
