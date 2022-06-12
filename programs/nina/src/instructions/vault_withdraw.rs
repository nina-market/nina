use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Token, Transfer, Mint};

use crate::state::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct VaultWithdraw<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"nina-vault".as_ref()],
        bump,
        constraint = vault.authority == authority.key(),
    )]
    pub vault: Account<'info, Vault>,
    /// CHECK: This is safe because PDA is derived from vault which is checked above
    #[account(
        seeds = [b"nina-vault-signer".as_ref(), vault.key().as_ref()],
        bump,
    )]
    pub vault_signer: UncheckedAccount<'info>,
    #[account(
        mut,
        constraint = withdraw_target.owner == *vault_signer.to_account_info().key,
        constraint = withdraw_target.mint == withdraw_mint.key()
    )]
    pub withdraw_target: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = withdraw_destination.owner == *authority.key,
        constraint = withdraw_destination.mint == withdraw_mint.key()
    )]
    pub withdraw_destination: Box<Account<'info, TokenAccount>>,
    pub withdraw_mint: Account<'info, Mint>,
    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<VaultWithdraw>,
    amount: u64,
) -> Result<()> {
    let vault = &ctx.accounts.vault;

    if ctx.accounts.withdraw_target.amount < amount {
        return Err(error!(ErrorCode::VaultWithdrawAmountTooHigh));
    }

    if amount <= 0 {
        return Err(error!(ErrorCode::VaultWithdrawAmountMustBeGreaterThanZero));
    }

    //Withdraw to Authority Token Account
    let cpi_accounts = Transfer {
        from: ctx.accounts.withdraw_target.to_account_info(),
        to: ctx.accounts.withdraw_destination.to_account_info(),
        authority: ctx.accounts.vault_signer.to_account_info().clone(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info().clone();

    let seeds = &[
        b"nina-vault-signer".as_ref(),
        ctx.accounts.vault.to_account_info().key.as_ref(),
        &[vault.bumps.signer],
    ];
    let signer = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, amount)?;

    Ok(())
}
