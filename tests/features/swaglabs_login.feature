@Author:Juan

Feature: Login swaglabs

  As a user
  I want to log in to the swaglabs application
  to view the products.

  Rule: Customers needs to provide valid credentials to access the site

    @UserHistory=1234
    Scenario Outline: Login on with invalid credentials
      Given User is on the login page
      When User attempts to login with the following credentials
        | username   | password   |
        | <username> | <password> |
      Then he should be presented with the error message
        | message   |
        | <message> |

      Examples:
        | username        | password       | message                                                                   |
        | standard_user   | wrong_password | Epic sadface: Username and password do not match any user in this service |
        | unknown_user    | secret_sauce   | Epic sadface: Username and password do not match any user in this service |
        | unknown_user    | wrong_password | Epic sadface: Username and password do not match any user in this service |
        | locked_out_user | secret_sauce   | Epic sadface: Sorry, this user has been locked out.                       |

    Scenario: Login with valid credentials
      Given User is logged in with valid credentials
      Then User can see the products

    @intentional-failure
    Scenario: Intentional failure to verify screenshot attachments
      Given User is on the login page
      When User attempts to login with the following credentials
        | username      | password       |
        | standard_user | wrong_password |
      Then he should be presented with the error message
        | message                                        |
        | Intentional mismatch to verify the screenshot |