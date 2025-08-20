#!/usr/bin/env python3
"""
Test script for the entity extraction model.
Run this to test the extract_entities_from_text function with various examples.
"""

import sys
import os
import json
import time
import requests
from typing import Dict, Any

# Add the current directory to Python path to import the model
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configuration
ENTITY_EXTRACTION_URL = "http://localhost:8080/entity-extraction"


class EntityExtractionTester:
    """Test runner with assertions and performance metrics."""
    
    def __init__(self):
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.performance_metrics = {}
        
    def extract_entities_from_text(self, text: str, entity_types: Dict[str, str]) -> Dict[str, Any]:
        """Extract entities from text using the HTTP endpoint."""
        payload = {
            "text": text,
            "entities": entity_types
        }
        
        try:
            response = requests.post(ENTITY_EXTRACTION_URL, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": f"HTTP request failed: {str(e)}"}
        except json.JSONDecodeError as e:
            return {"error": f"Invalid JSON response: {str(e)}"}
        
    def _get_value_by_json_path(self, data: Dict, path: str):
        """Get value from nested dictionary using JSON path notation."""
        if not path or path == "":
            return data
            
        parts = path.split('.')
        current = data
        
        for part in parts:
            if part.startswith('[') and part.endswith(']'):
                # Handle array access like [0], [1], etc.
                try:
                    index = int(part[1:-1])
                    if isinstance(current, list) and 0 <= index < len(current):
                        current = current[index]
                    else:
                        return None
                except (ValueError, IndexError):
                    return None
            else:
                # Handle regular key access
                if isinstance(current, dict) and part in current:
                    current = current[part]
                else:
                    return None
                    
        return current
    
    def assert_entity_extracted(self, result: Dict, entity_type: str, expected_value: str = None, 
                               confidence_threshold: float = 0.5) -> bool:
        """Assert that a specific entity was extracted with minimum confidence using JSON path."""
        if "error" in result:
            print(f"❌ ERROR: {result['error']}")
            return False
            
        # Use JSON path to get the entity data
        entity_data = self._get_value_by_json_path(result, entity_type)
        
        if entity_data is None:
            print(f"❌ FAIL: Entity path '{entity_type}' not found in result")
            print(f"🔍 DEBUG: Available keys in result: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
            return False
            
        # Handle different data structures
        if isinstance(entity_data, dict):
            # Standard format with value and confidence
            if "value" not in entity_data:
                print(f"❌ FAIL: Entity '{entity_type}' missing 'value' field")
                return False
                
            value = entity_data.get("value")
            confidence = entity_data.get("confidence", 0.0)
        else:
            # Direct value (string, number, etc.)
            value = entity_data
            confidence = 1.0  # Assume high confidence for direct values
        
        if value is None:
            print(f"⚠️  WARN: Entity '{entity_type}' not found (confidence: {confidence:.2f})")
            return False
            
        if confidence < confidence_threshold:
            print(f"⚠️  WARN: Entity '{entity_type}' has low confidence: {confidence:.2f} (threshold: {confidence_threshold})")
            return False
            
        if expected_value and expected_value.lower() not in str(value).lower():
            print(f"⚠️  WARN: Entity '{entity_type}' expected '{expected_value}', got '{value}' (confidence: {confidence:.2f})")
            return False
            
        print(f"✅ PASS: Entity '{entity_type}' = '{value}' (confidence: {confidence:.2f})")
        return True
    
    def run_test(self, test_name: str, test_func, *args, **kwargs):
        """Run a test and track results."""
        self.total_tests += 1
        print(f"\n🧪 Running: {test_name}")
        print("-" * 40)
        
        start_time = time.time()
        try:
            result = test_func(*args, **kwargs)
            execution_time = time.time() - start_time
            self.performance_metrics[test_name] = execution_time
            
            if result:
                self.passed_tests += 1
                print(f"✅ {test_name} PASSED in {execution_time:.2f}s")
            else:
                self.failed_tests += 1
                print(f"❌ {test_name} FAILED in {execution_time:.2f}s")
                
        except Exception as e:
            execution_time = time.time() - start_time
            self.performance_metrics[test_name] = execution_time
            self.failed_tests += 1
            print(f"❌ {test_name} FAILED with exception: {e} in {execution_time:.2f}s")
            return False
            
        return result
    
    def print_summary(self):
        """Print test summary and performance metrics."""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests} ✅")
        print(f"Failed: {self.failed_tests} ❌")
        print(f"Success Rate: {(self.passed_tests/self.total_tests)*100:.1f}%")
        
        print(f"\n⏱️  PERFORMANCE METRICS:")
        for test_name, execution_time in self.performance_metrics.items():
            print(f"  {test_name}: {execution_time:.2f}s")
        
        avg_time = sum(self.performance_metrics.values()) / len(self.performance_metrics) if self.performance_metrics else 0
        print(f"  Average: {avg_time:.2f}s")

def test_pinsaguel(tester: EntityExtractionTester) -> bool:
    """Test entity extraction from a single email with assertions."""
    email_text = """
    Bonjour, La médiathèque de Pinsaguel (31) participe à l’événement national « La nuit de la lecture » 
    le vendredi 24 janvier 2025 de 18h à 22h. Si vous êtes disponible à cette date, nous souhaiterions un 
    devis de votre prestation « préparation d’un risotto + dégustation/repas (20/25pers) + contes ». 
    Un partenariat avec le centre initiative jeune de la ville est en place pour cet évènement. 
    Les contes seraient-ils adaptés à ce public 11 ans et plus ? Je vous remercie, Cordialement, 
    Laurie Cartier 
    MEDIATHEQUE SALOU CASAÏS 
    http://mediatheque.mairie-pinsaguel.com/ 
    Tel : 05.61.76.88.68
    """
    
    entity_types = {
        "sender": {
            "name": ""
        },
        "organization": {
            "organization_name": "",
            "website": "",
            "phone_number": "",
            "type": "Médiathèque, mairie, école...",
            "city": ""
        },
        "gigs": [{
            "date": "the date for the requested performance (include time if specified)",
            "performance_type": "risottoexperience, europe, train, sorcieres..."
        }]
    }
    
    print(f"Email text:\n{email_text}")
    print(f"\nExtracting entities: {entity_types}")
    
    try:
        result = tester.extract_entities_from_text(email_text, entity_types)
        print("\nExtraction Result:")
        print(json.dumps(result, indent=2))
        
        # Assertions for expected entities
        print(f"\n🔍 ASSERTIONS:")
        assertions_passed = 0
        total_assertions = 0
        
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'sender.name', 'Laurie Cartier', confidence_threshold=0.3):
            assertions_passed += 1
                        
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'gigs.[0].date', '24 janvier 2025', confidence_threshold=0.3):
            assertions_passed += 1
            
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'gigs.[0].performance_type', 'risottoexperience', confidence_threshold=0.3):
            assertions_passed += 1
            
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.organization_name', 'MEDIATHEQUE SALOU CASAÏS', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.website', 'http://mediatheque.mairie-pinsaguel.com/', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.phone_number', '05.61.76.88.68', confidence_threshold=0.3):
            assertions_passed += 1
        
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.city', 'Pinsaguel', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.type', 'Médiathèque', confidence_threshold=0.3):
            assertions_passed += 1
            
        print(f"\nAssertions: {assertions_passed}/{total_assertions} passed")
        return assertions_passed >= total_assertions * 0.6  # At least 60% accuracy
        
    except Exception as e:
        print(f"Error during extraction: {e}")
        return False

def test_simple_email(tester: EntityExtractionTester) -> bool:
    """Test with a simpler email format."""
    email_text = "Hello John, the invoice for $500 from ABC Company is due on Friday."
    
    entity_types = {
        "name": "string",
        "company": "string", 
        "amount": "string",
        "date": "string"
    }
    
    print(f"Email text: {email_text}")
    print(f"Extracting entities: {entity_types}")
    
    try:
        result = tester.extract_entities_from_text(email_text, entity_types)
        print("\nExtraction Result:")
        print(json.dumps(result, indent=2))
        
        print(f"\n🔍 ASSERTIONS:")
        assertions_passed = 0
        total_assertions = 0
        
        # Test for name
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'name', 'John', confidence_threshold=0.3):
            assertions_passed += 1
            
        # Test for company
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'company', 'ABC', confidence_threshold=0.3):
            assertions_passed += 1
            
        # Test for amount
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'amount', '500', confidence_threshold=0.3):
            assertions_passed += 1
            
        print(f"\nAssertions: {assertions_passed}/{total_assertions} passed")
        return assertions_passed >= total_assertions * 0.6
        
    except Exception as e:
        print(f"Error during extraction: {e}")
        return False

def test_marie_paris_clermontais(tester: EntityExtractionTester) -> bool:
    """Test with a business deal email."""
    email_text = """
    Subject: Renseignements Réseau des bibliothèques du Clermontais
    
    Bonjour Luca,
 
    Je coordonne le Réseau des bibliothèques du Clermontais, vous aviez essayé de me contacter par téléphone et 
    je réalise que je n’avais pas pris le temps de vous rappeler, veuillez m’en excuser.
    Je suis entrain de réfléchir aux animations que je souhaite proposer aux bibliothèques du Clermontais en 2025 
    et j’aurai souhaité connaître vos tarifs pour la danse des sorcières, Barbe nuit et la risotto expérience.
    L’idée serait de voir si je serai en mesure de programmer un de vos spectacles dans 2 ou 3 bibliothèques et 
    si vous seriez intéressé bien sûr !
    Pour l’instant j’en suis encore à l’étape de la réflexion,
 
    Je vous remercie,
    
    Bien à vous,
    
    Marie Paris
    Coordinatrice du Réseau des bibliothèques
    Pôle Culture
    Communauté de communes du Salagou Cœur d’Hérault
    Espace Marcel Vidal - 20 Avenue Raymond Lacombe
    34800 Clermont l’Hérault
    09 71 00 29 58 / 07 89 38 92 03
    bibliotheques.cc-clermontais.fr
    """
    
    entity_types = {
        "sender": {
            "name": ""
        },
        "organization": {
            "name": "",
            "website": "",
            "phone_number": "",
            "type": "choose among the following options: Médiathèque, Mairie, Ecole, Communauté de Communes, Théâtre, Office du Tourisme, MJC, Université",
            "city": ""
        },
        "gigs": [{
            "date": "the date for the requested performance (include time if specified)",
            "performance_type": "risottoexperience, europe, train, sorcieres..."
        }]
    }
    
    print(f"Email text:\n{email_text}")
    print(f"Extracting entities: {entity_types}")
    
    try:
        result = tester.extract_entities_from_text(email_text, entity_types)
        print("\nExtraction Result:")
        print(json.dumps(result, indent=2))
        
        print(f"\n🔍 ASSERTIONS:")
        assertions_passed = 0
        total_assertions = 0
        
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'sender.name', 'Marie Paris', confidence_threshold=0.3):
            assertions_passed += 1
                        
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'gigs.[0].date', '2025', confidence_threshold=0.3):
            assertions_passed += 1
            
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'gigs.[0].performance_type', 'sorcieres', confidence_threshold=0.3):
            assertions_passed += 1
            
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.name', 'Réseau des bibliothèques du Clermontais', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.website', 'bibliotheques.cc-clermontais.fr', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.phone_number', '09 71 00 29 58 / 07 89 38 92 03', confidence_threshold=0.3):
            assertions_passed += 1
        
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.city', 'Clermont l’Hérault', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.type', 'Communauté de Communes', confidence_threshold=0.3):
            assertions_passed += 1
            
        print(f"\nAssertions: {assertions_passed}/{total_assertions} passed")
        return assertions_passed >= total_assertions * 0.6
        
    except Exception as e:
        print(f"Error during extraction: {e}")
        return False

def test_manerbio(tester: EntityExtractionTester) -> bool:
    """Test with a business deal email."""
    email_text = """
    Subject: Animation risotto/contes
    
    Bonjour,

    Nous sommes un comité de jumelage avec l'Italie (MANERBIO en Lombardie) et nous aimerions organiser 
    une manifestation destinée aux enfants, autour du risotto, dans le cadre de la semaine du goût. 
    C'est Madame Sylvie DEFRANOUX qui nous a donné vos coordonnées.

    Cet évènement est fixé au mercredi 16 octobre 2024 et pourrait se dérouler de 10/11 h à 16/17 h environ.

    Pourriez-vous SVP nous dire si vous êtes disponible ce jour là et le cas échéant nous établir un devis.

    Merci d'avance.

    Bien cordialement.

    Marie MORCHAIN
    Secrétaire du Comité de Jumelage St Martin de Crau/Manerbio
    """
    
    entity_types = {
        "sender": {
            "name": ""
        },
        "organization": {
            "name": "",
            "website": "",
            "phone_number": "",
            "type": "choose among the following options: Médiathèque, Association,Mairie, Ecole, Communauté de Communes, Théâtre, Office du Tourisme, MJC, Université",
            "city": ""
        },
        "gigs": [{
            "date": "the date for the requested performance (include time if specified)",
            "performance_type": "risottoexperience, europe, train, sorcieres..."
        }]
    }
    
    print(f"Email text:\n{email_text}")
    print(f"Extracting entities: {entity_types}")
    
    try:
        result = tester.extract_entities_from_text(email_text, entity_types)
        print("\nExtraction Result:")
        print(json.dumps(result, indent=2))
        
        print(f"\n🔍 ASSERTIONS:")
        assertions_passed = 0
        total_assertions = 0
        
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'sender.name', 'Marie MORCHAIN', confidence_threshold=0.3):
            assertions_passed += 1
                        
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'gigs.[0].date', '16 octobre 2024', confidence_threshold=0.3):
            assertions_passed += 1
            
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'gigs.[0].performance_type', 'risottoexperience', confidence_threshold=0.3):
            assertions_passed += 1
            
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.name', 'Comité de Jumelage St Martin de Crau/Manerbio', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.city', 'Manerbio', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.type', 'Association', confidence_threshold=0.3):
            assertions_passed += 1
            
        print(f"\nAssertions: {assertions_passed}/{total_assertions} passed")
        return assertions_passed >= total_assertions * 0.6
        
    except Exception as e:
        print(f"Error during extraction: {e}")
        return False

def test_sorgues(tester: EntityExtractionTester) -> bool:
    """Test with a business deal email."""
    email_text = """
    Subject: Proposition de date Risotto expérience
    
    Bonjour Luca,

    Je vous présente mes meilleurs vœux pour 2025

    Seriez-vous disponible le samedi 8 novembre 2025 pour animer le Risotto expérience 
    dans l’après-midi et en soirée ?
    Dans l'attente de votre réponse,
    Bien chaleureusement,

    Mélanie


    ------

    Mélanie Patti - Bibliothécaire
    Responsable du secteur Adulte, Musique & Cinéma
    Médiathèque Jean Tortel
    Pôle Culturel Camille Claudel
    285 Avenue d'Avignon
    84700 Sorgues

    04 90 39 71 33
    http://mediatheque.sorgues.fr
    """
    
    entity_types = {
        "sender": {
            "name": ""
        },
        "organization": {
            "name": "",
            "website": "",
            "phone_number": "",
            "type": "choose among the following options: Médiathèque, Association,Mairie, Ecole, Communauté de Communes, Théâtre, Office du Tourisme, MJC, Université",
            "city": ""
        },
        "gigs": [{
            "date": "the date for the requested performance (include time if specified)",
            "performance_type": "risottoexperience, europe, train, sorcieres..."
        }]
    }
    
    print(f"Email text:\n{email_text}")
    print(f"Extracting entities: {entity_types}")
    
    try:
        result = tester.extract_entities_from_text(email_text, entity_types)
        print("\nExtraction Result:")
        print(json.dumps(result, indent=2))
        
        print(f"\n🔍 ASSERTIONS:")
        assertions_passed = 0
        total_assertions = 0
        
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'sender.name', 'Mélanie Patti', confidence_threshold=0.3):
            assertions_passed += 1
                        
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'gigs.[0].date', '8 novembre 2025', confidence_threshold=0.3):
            assertions_passed += 1
            
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'gigs.[0].performance_type', 'risottoexperience', confidence_threshold=0.3):
            assertions_passed += 1
            
        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.name', 'Médiathèque Jean Tortel', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.city', 'Sorgues', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.website', 'http://mediatheque.sorgues.fr', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.phone_number', '04 90 39 71 33', confidence_threshold=0.3):
            assertions_passed += 1

        total_assertions += 1
        if tester.assert_entity_extracted(result, 'organization.type', 'Médiathèque', confidence_threshold=0.3):
            assertions_passed += 1
            
        print(f"\nAssertions: {assertions_passed}/{total_assertions} passed")
        return assertions_passed >= total_assertions * 0.6
        
    except Exception as e:
        print(f"Error during extraction: {e}")
        return False

def test_error_handling(tester: EntityExtractionTester) -> bool:
    """Test error handling with edge cases."""
    print("Testing error handling scenarios:")
    
    tests_passed = 0
    total_tests = 0
    
    # Test with empty text
    total_tests += 1
    try:
        result = tester.extract_entities_from_text("", {"name": "string", "company": "string"})
        if "error" in result or all(entity.get("value") is None for entity in result.values() if isinstance(entity, dict)):
            print("✅ PASS: Empty text handled gracefully")
            tests_passed += 1
        else:
            print("❌ FAIL: Empty text should return no entities")
    except Exception as e:
        print(f"✅ PASS: Empty text caused expected exception: {e}")
        tests_passed += 1
    
    # Test with very short text
    total_tests += 1
    try:
        result = tester.extract_entities_from_text("Hi", {"name": "string", "company": "string"})
        if result and not "error" in result:
            print("✅ PASS: Short text processed without error")
            tests_passed += 1
        else:
            print("❌ FAIL: Short text should be processable")
    except Exception as e:
        print(f"❌ FAIL: Short text caused unexpected exception: {e}")
    
    return tests_passed >= total_tests * 0.5

def main():
    """Run all tests with enhanced assertions and metrics."""
    print("🧪 ENHANCED ENTITY EXTRACTION MODEL TESTING")
    print("=" * 60)
    print(f"Testing endpoint: {ENTITY_EXTRACTION_URL}")
    
    tester = EntityExtractionTester()
    
    # Run entity extraction tests
    tester.run_test("Simple Email Format", test_simple_email, tester)
    tester.run_test("Pinsaguel", test_pinsaguel, tester)
    tester.run_test("Marie Paris Clermontais", test_marie_paris_clermontais, tester)
    tester.run_test("Manerbio", test_manerbio, tester)
    tester.run_test("Sorgues", test_sorgues, tester)
    tester.run_test("Error Handling", test_error_handling, tester)
    
    # Print comprehensive summary
    tester.print_summary()

if __name__ == "__main__":
    main()
