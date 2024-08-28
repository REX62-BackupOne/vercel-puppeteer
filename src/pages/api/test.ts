import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const fs = require('fs');
const path = require('path');

puppeteerExtra.use(StealthPlugin());



export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { searchParams } = new URL(req.url as string, `http://${req.headers.host}`);
    const url = searchParams.get('url');

    if (!url) {
        return res.status(400).json({ message: 'A ?url query-parameter is required' });
    }

    function isPackageInNodeModules(packageName: string) {
        // Construct the path to the package in node_modules
        const packagePath = path.join(__dirname, 'node_modules', packageName);

        // Check if the package directory exists
        return fs.existsSync(packagePath);
    }
    function isFileInPackage(packageName: string, filePath: string) {
        // Construct the path to the file in the package directory
        const packageFilePath = path.join(__dirname, 'node_modules', packageName, filePath);

        // Check if the file exists
        return fs.existsSync(packageFilePath);
    }
    const packageNames = ['puppeteer-extra', 'chrome-aws-lambda', 'puppeteer-extra-plugin-stealth'];
    for (const packageName of packageNames) {
        const isInstalled = isPackageInNodeModules(packageName);

        console.log(`${packageName} is ${isInstalled ? 'installed' : 'not installed'}`);
    }

    const packageName = 'puppeteer-extra-plugin-stealth';
    const filePath = 'evasions/chrome.app'; // or any specific file within the package
    const fileExists = isFileInPackage(packageName, filePath);

    console.log(`File ${filePath} in ${packageName} is ${fileExists ? 'present' : 'missing'}`)
    try {
        const browser = await puppeteerExtra.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const html = await page.content();

        await browser.close();

        return res.status(200).send(html);
    } catch (e: unknown) {
        console.error(e);
        if (e instanceof Error) {
            return res.status(500).json({ error: e.message });
        }
        return res.status(500).json({ error: 'An unknown error occurred' });
    }
}
