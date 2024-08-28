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

    try {
        const browser = await puppeteerExtra.launch({
            headless: true,
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
