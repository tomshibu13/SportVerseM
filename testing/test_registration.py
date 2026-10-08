import pytest
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions
# pyrefly: ignore [missing-import]
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

class TestRegistration():
  def setup_method(self, method):
    self.driver = webdriver.Chrome()
    self.vars = {}
  
  def teardown_method(self, method):
    self.driver.quit()
  
  def test_registration(self):
    self.driver.get("http://localhost:8080/")
    self.driver.set_window_size(902, 816)
    WebDriverWait(self.driver, 30).until(expected_conditions.presence_of_element_located((By.CSS_SELECTOR, "flutter-view")))
    time.sleep(2)
    flutter_view = self.driver.find_element(By.CSS_SELECTOR, "flutter-view")
    
    for _ in range(5):
        ActionChains(self.driver).send_keys(Keys.TAB).perform()
        time.sleep(0.2)
    ActionChains(self.driver).send_keys(Keys.ENTER).perform()
    time.sleep(3)
    
    for y_offset in range(170, 240, 10):
        try:
            ActionChains(self.driver).move_to_element_with_offset(flutter_view, 80, y_offset).click().perform()
        except Exception:
            pass
        time.sleep(0.1)
        
    time.sleep(3) 
    
    for _ in range(15):
        ActionChains(self.driver).send_keys(Keys.TAB).perform()
        time.sleep(0.5)
        if len(self.driver.find_elements(By.CSS_SELECTOR, ".flt-text-editing")) > 0:
            break
            
    WebDriverWait(self.driver, 5).until(expected_conditions.presence_of_element_located((By.CSS_SELECTOR, ".flt-text-editing")))
    self.driver.find_element(By.CSS_SELECTOR, ".flt-text-editing:nth-child(1)").send_keys("Amal ")
    
    ActionChains(self.driver).send_keys(Keys.TAB).perform()
    time.sleep(0.5)
    self.driver.find_element(By.CSS_SELECTOR, ".flt-text-editing").send_keys("amal@gmail.com")
    
    ActionChains(self.driver).send_keys(Keys.TAB).perform()
    time.sleep(0.5)
    self.driver.find_element(By.CSS_SELECTOR, ".flt-text-editing").send_keys("9632587896")
    
    ActionChains(self.driver).send_keys(Keys.TAB).perform()
    time.sleep(0.5)
    self.driver.find_element(By.CSS_SELECTOR, ".flt-text-editing").send_keys("Amal@1234")
    
    ActionChains(self.driver).send_keys(Keys.TAB).perform()
    time.sleep(0.5)
    self.driver.find_element(By.CSS_SELECTOR, ".flt-text-editing").send_keys("Amal@1234")
  
