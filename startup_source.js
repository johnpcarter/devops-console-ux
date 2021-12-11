describe('source', function() {

browser.ignoreSynchronization = true; 

     browser.get("http://Administrator:manage@localhost:9090/")

    it ("check source code access", async function() {

        await browser.sleep(1000)

        console.log("checking source code access")
        
        await driver.switchTo().frame(0)

        await browser.findElement(By.css(".mat-content > .selected")).click()

        await browser.sleep(2000)

        await browser.findElement(By.css("#cdk-accordion-child-0 .mat-list-item:nth-child(2) > .mat-list-item-content")).click()
        await browser.findElement(By.id("mat-input-0")).click()
    })
})