use crate::state::*;

use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(hub_handle: String)]
pub struct SubscriptionSubscribeHub<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(
        init,
        seeds = [b"nina-subscription", from.key().as_ref(), to.key().as_ref()],
        bump,
        payer = from,
        space = 121
    )]
    pub subscription: Account<'info, Subscription>,
    #[account(
        seeds = [b"nina-hub", hub_handle.as_bytes()],
        bump,
    )]
    pub to: AccountLoader<'info, Hub>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
  ctx: Context<SubscriptionSubscribeHub>,
  _hub_handle: String,
) -> Result<()> {
    let subscription = &mut ctx.accounts.subscription;
    subscription.from = ctx.accounts.from.key();
    subscription.to = ctx.accounts.to.key();
    subscription.subscription_type = SubscriptionType::Hub;
    subscription.datetime = Clock::get()?.unix_timestamp;
    
    emit!(SubscriptionSubscribed {
        public_key: subscription.key(),
        from: subscription.from,
        to: subscription.to,
        subscription_type: subscription.subscription_type,
        datetime: subscription.datetime,
    });

    Ok(())
}
