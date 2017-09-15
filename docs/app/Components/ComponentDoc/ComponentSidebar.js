import _ from 'lodash'
import React, {Component} from 'react'
import {Accordion, Menu, Sticky} from 'semantic-ui-react'
import { withRouter } from 'react-router'

import { scrollToAnchor } from 'docs/app/utils'
import menuInfo from 'docs/app/menuInfo.json'

const sidebarStyle = {
  background: '#fff',
  boxShadow: '0 2px 2px rgba(0, 0, 0, 0.1)',
  paddingLeft: '1em',
  paddingTop: '0.1em',
}

class ComponentSidebar extends Component {
  setHashAndScroll = (e, {name}) => {
    const aName = _.kebabCase(_.last(name.split('/')))
    const { history } = this.props
    history.replace(`${location.pathname}#${aName}`)
    scrollToAnchor()
  }

  render() {
    const {activePath, componentName, examplesRef} = this.props
    const items = _.get(menuInfo, componentName)

    return (
      <Sticky context={examplesRef} offset={15}>
        <Menu as={Accordion} fluid vertical text style={sidebarStyle}>
          {_.map(items, ({name, examples}) => {
            return (
              <Menu.Item>
                <Accordion.Title active><b>{name}</b></Accordion.Title>
                <Accordion.Content as={Menu.Menu} active>
                  {_.map(examples, ({title, path}) => <Menu.Item active={activePath === path} key={path} name={path} content={title} onClick={this.setHashAndScroll}/>)}
                </Accordion.Content>
              </Menu.Item>
            )
          })}
        </Menu>
      </Sticky>
    )
  }
}

export default withRouter(ComponentSidebar)