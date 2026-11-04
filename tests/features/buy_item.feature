@Author:Juan

Feature: Purchase items in Swag Labs

  As a user
  I want to add products to my cart and complete checkout
  to receive an order confirmation.

  Rule: Authenticated customers can purchase products

    Background:
      Given User is logged in with valid credentials

    Scenario: Add an item to the cart
      When User adds "Sauce Labs Backpack" to the cart
      Then the cart contains "Sauce Labs Backpack"

    Scenario: Buy Item
      When User adds "Sauce Labs Backpack" to the cart
      And User completes checkout with the following details
        | firstName | lastName | postalCode |
        | Test      | User     | 12345      |
      Then he can see finalized his purchase
        | Thank you for your order! |
